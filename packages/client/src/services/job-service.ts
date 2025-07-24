import AsyncLock from 'async-lock';

import { SelectJob, SelectJobSchedule } from '@colanode/client/databases/app';
import {
  Job,
  JobHandler,
  JobHandlerMap,
  JobInput,
  JobOptions,
  JobScheduleOptions,
  JobStatus,
} from '@colanode/client/jobs';
import { AccountSyncJobHandler } from '@colanode/client/jobs/account-sync';
import { FileDownloadJobHandler } from '@colanode/client/jobs/file-download';
import { FileUploadJobHandler } from '@colanode/client/jobs/file-upload';
import { FilesCleanTempJobHandler } from '@colanode/client/jobs/files-clean-temp';
import { MutationsSyncJobHandler } from '@colanode/client/jobs/mutations-sync';
import { ServerSyncJobHandler } from '@colanode/client/jobs/server-sync';
import { TokenDeleteJobHandler } from '@colanode/client/jobs/token-delete';
import { SleepScheduler } from '@colanode/client/lib/sleep-scheduler';
import { AppService } from '@colanode/client/services/app-service';
import { generateId, IdType } from '@colanode/core';

const MAX_CONCURRENCY = 5;
const JOBS_MAX_TIMEOUT = 30000;
const SCHEDULES_MAX_TIMEOUT = 30000;
const JOBS_CONCURRENCY_TIMEOUT = 50;
const CLOSE_TIMEOUT = 50;
const JOB_LOOP_ID = 'job.loop';
const SCHEDULE_LOOP_ID = 'schedule.loop';

export class JobService {
  private readonly app: AppService;
  private readonly queue: string = 'main';
  private readonly handlerMap: JobHandlerMap;
  private readonly runningConcurrency = new Map<string, number>();
  private readonly lock = new AsyncLock();
  private readonly sleepScheduler = new SleepScheduler();

  private stopped = false;
  private runningJobs = 0;

  constructor(app: AppService) {
    this.app = app;

    this.handlerMap = {
      'token.delete': new TokenDeleteJobHandler(app),
      'account.sync': new AccountSyncJobHandler(app),
      'files.clean.temp': new FilesCleanTempJobHandler(app),
      'server.sync': new ServerSyncJobHandler(app),
      'file.upload': new FileUploadJobHandler(app),
      'file.download': new FileDownloadJobHandler(app),
      'mutations.sync': new MutationsSyncJobHandler(app),
    };
  }

  public async init(): Promise<void> {
    await this.app.database
      .updateTable('jobs')
      .set({ status: 'waiting' })
      .execute();

    this.jobLoop().catch((err) => console.error('Job loop error:', err));
    this.scheduleLoop().catch((err) =>
      console.error('Schedule loop error:', err)
    );
  }

  public async addJob(
    input: JobInput,
    opts?: JobOptions
  ): Promise<SelectJob | null> {
    const handler = this.handlerMap[input.type] as JobHandler<typeof input>;
    if (!handler) {
      return null;
    }

    const now = Date.now();
    const scheduledAt = opts?.delay ? now + opts.delay : now;
    const concurrencyKey = handler.concurrency?.key?.(input);

    if (opts?.deduplication) {
      const deduplication = opts.deduplication;

      const result = await this.lock.acquire(deduplication.key, async () => {
        const existing = await this.app.database
          .selectFrom('jobs')
          .selectAll()
          .where('deduplication_key', '=', deduplication.key)
          .where('status', '=', 'waiting')
          .executeTakeFirst();

        if (!existing) {
          return null;
        }

        if (!deduplication.replace) {
          return existing;
        }

        const updatedJob = await this.app.database
          .updateTable('jobs')
          .set({
            input: this.toJSON(input),
            options: this.toJSON(opts),
            scheduled_at: scheduledAt,
            concurrency_key: concurrencyKey || null,
            updated_at: now,
          })
          .where('id', '=', existing.id)
          .where('status', '=', 'waiting')
          .returningAll()
          .executeTakeFirst();

        return updatedJob ?? null;
      });

      if (result) {
        const timestamp = result.scheduled_at;
        this.sleepScheduler.updateResolveTimeIfEarlier(JOB_LOOP_ID, timestamp);
        return result;
      }
    }

    const id = generateId(IdType.Job);
    const job = await this.app.database
      .insertInto('jobs')
      .returningAll()
      .values({
        id,
        queue: this.queue,
        input: this.toJSON(input),
        options: this.toJSON(opts),
        status: 'waiting',
        retries: 0,
        scheduled_at: scheduledAt,
        deduplication_key: opts?.deduplication?.key || null,
        concurrency_key: concurrencyKey || null,
        created_at: now,
        updated_at: now,
      })
      .executeTakeFirst();

    if (job) {
      const timestamp = job.scheduled_at;
      this.sleepScheduler.updateResolveTimeIfEarlier(JOB_LOOP_ID, timestamp);
    }

    return job ?? null;
  }

  public async upsertJobSchedule(
    id: string,
    input: JobInput,
    interval: number,
    opts?: JobScheduleOptions
  ): Promise<SelectJobSchedule | null> {
    const now = Date.now();
    const schedule = await this.app.database
      .insertInto('job_schedules')
      .returningAll()
      .values({
        id,
        queue: this.queue,
        input: this.toJSON(input),
        options: this.toJSON(opts),
        status: 'active',
        interval: interval,
        next_run_at: now + interval,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.columns(['id']).doUpdateSet({
          input: this.toJSON(input),
          options: this.toJSON(opts),
          interval: interval,
          next_run_at: now + interval,
          updated_at: now,
          status: 'active',
        })
      )
      .executeTakeFirst();

    if (schedule) {
      const timestamp = schedule.next_run_at;
      this.sleepScheduler.updateResolveTimeIfEarlier(
        SCHEDULE_LOOP_ID,
        timestamp
      );
    }

    return schedule ?? null;
  }

  public async removeJobSchedule(id: string): Promise<void> {
    await this.app.database
      .deleteFrom('job_schedules')
      .where('id', '=', id)
      .execute();
  }

  public async triggerJobSchedule(id: string): Promise<SelectJob | null> {
    const schedule = await this.app.database
      .selectFrom('job_schedules')
      .selectAll()
      .where('id', '=', id)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!schedule) {
      return null;
    }

    return this.addJobFromSchedule(schedule);
  }

  public async close() {
    this.stopped = true;
    while (this.runningJobs > 0) {
      await new Promise((r) => setTimeout(r, CLOSE_TIMEOUT));
    }
  }

  private async jobLoop() {
    while (!this.stopped) {
      if (this.runningJobs >= MAX_CONCURRENCY) {
        const timestamp = Date.now() + JOBS_CONCURRENCY_TIMEOUT;
        await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, timestamp);
        continue;
      }

      const limitReachedTypes = new Set<string>();
      for (const [type, handler] of Object.entries(this.handlerMap)) {
        if (handler.concurrency) {
          const currentCount = this.runningConcurrency.get(type) || 0;
          if (currentCount >= handler.concurrency.limit) {
            limitReachedTypes.add(type);
          }
        }
      }

      const now = Date.now();
      const jobRow = await this.app.database
        .updateTable('jobs')
        .set({
          status: 'active',
          updated_at: now,
        })
        .where('id', 'in', (qb) =>
          qb
            .selectFrom('jobs')
            .select('id')
            .where('queue', '=', this.queue)
            .where('status', '=', 'waiting')
            .where('scheduled_at', '<=', now)
            .where('concurrency_key', 'not in', Array.from(limitReachedTypes))
            .orderBy('scheduled_at', 'asc')
            .limit(1)
        )
        .returningAll()
        .executeTakeFirst();

      if (!jobRow) {
        const nextScheduledJob = await this.app.database
          .selectFrom('jobs')
          .select('scheduled_at')
          .where('queue', '=', this.queue)
          .where('status', '=', 'waiting')
          .orderBy('scheduled_at', 'asc')
          .limit(1)
          .executeTakeFirst();

        if (nextScheduledJob) {
          const timestamp = nextScheduledJob.scheduled_at;
          await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, timestamp);
        } else {
          const timestamp = now + JOBS_MAX_TIMEOUT;
          await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, timestamp);
        }

        continue;
      }

      const input = this.fromJSON<JobInput>(jobRow.input) as JobInput;
      const handler = this.handlerMap[input.type] as JobHandler<typeof input>;

      if (handler?.concurrency) {
        const concurrencyKey = handler.concurrency.key(input);
        const currentCount = this.runningConcurrency.get(concurrencyKey) || 0;

        if (currentCount >= handler.concurrency.limit) {
          await this.app.database
            .updateTable('jobs')
            .set({ status: 'waiting', updated_at: Date.now() })
            .where('id', '=', jobRow.id)
            .execute();
          continue;
        }
      }

      this.handleJob(jobRow).catch((err) =>
        console.error('Job handling error:', err)
      );
    }
  }

  private async scheduleLoop() {
    while (!this.stopped) {
      const now = Date.now();

      const schedules = await this.app.database
        .selectFrom('job_schedules')
        .selectAll()
        .where('status', '=', 'active')
        .where('next_run_at', '<=', now)
        .execute();

      for (const schedule of schedules) {
        try {
          await this.addJobFromSchedule(schedule);

          await this.app.database
            .updateTable('job_schedules')
            .set({
              next_run_at: now + schedule.interval,
              last_run_at: now,
              updated_at: now,
            })
            .where('id', '=', schedule.id)
            .execute();
        } catch (error) {
          console.error(`Error processing schedule ${schedule.id}:`, error);
        }
      }

      const nextSchedule = await this.app.database
        .selectFrom('job_schedules')
        .select('next_run_at')
        .where('status', '=', 'active')
        .orderBy('next_run_at', 'asc')
        .limit(1)
        .executeTakeFirst();

      if (nextSchedule) {
        const timestamp = nextSchedule.next_run_at;
        await this.sleepScheduler.sleepUntil(SCHEDULE_LOOP_ID, timestamp);
      } else {
        const timestamp = now + SCHEDULES_MAX_TIMEOUT;
        await this.sleepScheduler.sleepUntil(SCHEDULE_LOOP_ID, timestamp);
      }
    }
  }

  private async addJobFromSchedule(schedule: SelectJobSchedule) {
    const input = this.fromJSON<JobInput>(schedule.input) as JobInput;
    const options = this.fromJSON<JobScheduleOptions>(schedule.options);

    return this.addJob(input, {
      retries: options?.retries,
    });
  }

  private async handleJob(jobRow: SelectJob) {
    const options = this.fromJSON<JobOptions>(jobRow.options) ?? {};
    const input = this.fromJSON<JobInput>(jobRow.input) as JobInput;

    const job: Job = {
      id: jobRow.id,
      queue: jobRow.queue,
      input,
      options,
      status: jobRow.status as JobStatus,
      retries: jobRow.retries,
      deduplicationKey: jobRow.deduplication_key ?? undefined,
      concurrencyKey: jobRow.concurrency_key ?? undefined,
      createdAt: jobRow.created_at,
      updatedAt: jobRow.updated_at,
      scheduledAt: jobRow.scheduled_at,
    };

    try {
      this.runningJobs++;

      if (jobRow.concurrency_key) {
        const current = this.runningConcurrency.get(input.type) || 0;
        this.runningConcurrency.set(input.type, current + 1);
      }

      const handler = this.handlerMap[input.type] as JobHandler<typeof input>;
      if (!handler) {
        await this.app.database
          .deleteFrom('jobs')
          .where('id', '=', jobRow.id)
          .execute();
        return;
      }

      const output = await handler.handleJob(job.input);

      if (output.type === 'retry') {
        await this.app.database
          .updateTable('jobs')
          .set({
            status: 'waiting',
            scheduled_at: Date.now() + output.delay,
            updated_at: Date.now(),
          })
          .where('id', '=', jobRow.id)
          .where('status', '=', 'active')
          .execute();
      } else {
        await this.app.database
          .deleteFrom('jobs')
          .where('id', '=', jobRow.id)
          .execute();
      }
    } catch (error) {
      console.error(`Job ${jobRow.id} failed:`, error);

      const retries = jobRow.retries + 1;
      if (options.retries && retries < options.retries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retries), 60000);
        await this.app.database
          .updateTable('jobs')
          .set({
            status: 'waiting',
            retries,
            scheduled_at: Date.now() + retryDelay,
            updated_at: Date.now(),
          })
          .where('id', '=', jobRow.id)
          .execute();
      } else {
        await this.app.database
          .deleteFrom('jobs')
          .where('id', '=', jobRow.id)
          .execute();
      }
    } finally {
      this.runningJobs--;

      if (jobRow.concurrency_key) {
        const current = this.runningConcurrency.get(input.type) || 0;
        if (current > 0) {
          this.runningConcurrency.set(input.type, current - 1);
        }
      }
    }
  }

  private toJSON(value: unknown) {
    return JSON.stringify(value ?? null);
  }

  private fromJSON<T>(txt: string | null): T | null {
    if (txt == null) return null;
    return JSON.parse(txt) as T;
  }
}
