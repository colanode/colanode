import AsyncLock from 'async-lock';

import { SelectJob, SelectJobSchedule } from '@colanode/client/databases/app';
import {
  Job,
  JobHandler,
  JobHandlerMap,
  JobInput,
  JobOptions,
  JobScheduleOptions,
  JobScheduleStatus,
  JobStatus,
} from '@colanode/client/jobs';
import { AccountSyncJobHandler } from '@colanode/client/jobs/account-sync';
import { AvatarDownloadJobHandler } from '@colanode/client/jobs/avatar-download';
import { AvatarsCleanJobHandler } from '@colanode/client/jobs/avatars-clean';
import { FileDownloadJobHandler } from '@colanode/client/jobs/file-download';
import { FileUploadJobHandler } from '@colanode/client/jobs/file-upload';
import { MutationsSyncJobHandler } from '@colanode/client/jobs/mutations-sync';
import { ServerSyncJobHandler } from '@colanode/client/jobs/server-sync';
import { TempFilesCleanJobHandler } from '@colanode/client/jobs/temp-files-clean';
import { TokenDeleteJobHandler } from '@colanode/client/jobs/token-delete';
import { WorkspaceFilesCleanJobHandler } from '@colanode/client/jobs/workspace-files-clean';
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
      'server.sync': new ServerSyncJobHandler(app),
      'file.upload': new FileUploadJobHandler(app),
      'file.download': new FileDownloadJobHandler(app),
      'mutations.sync': new MutationsSyncJobHandler(app),
      'temp.files.clean': new TempFilesCleanJobHandler(app),
      'workspace.files.clean': new WorkspaceFilesCleanJobHandler(app),
      'avatar.download': new AvatarDownloadJobHandler(app),
      'avatars.clean': new AvatarsCleanJobHandler(app),
    };
  }

  public async init(): Promise<void> {
    await this.app.database
      .updateTable('jobs')
      .set({ status: JobStatus.Waiting })
      .execute();

    this.jobLoop().catch((err) => console.error('Job loop error:', err));
    this.scheduleLoop().catch((err) =>
      console.error('Schedule loop error:', err)
    );
  }

  public async addJob(
    input: JobInput,
    opts?: JobOptions,
    scheduleId?: string
  ): Promise<SelectJob | null> {
    const handler = this.handlerMap[input.type] as JobHandler<typeof input>;
    if (!handler) {
      return null;
    }

    const now = new Date();
    const scheduledAt =
      opts?.delay && opts.delay > 0
        ? new Date(now.getTime() + opts.delay)
        : now;

    const concurrencyKey = handler.concurrency?.key?.(input);

    if (opts?.deduplication) {
      const deduplication = opts.deduplication;

      const result = await this.lock.acquire(deduplication.key, async () => {
        const existing = await this.app.database
          .selectFrom('jobs')
          .selectAll()
          .where('deduplication_key', '=', deduplication.key)
          .where('status', '=', JobStatus.Waiting)
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
            scheduled_at: scheduledAt.toISOString(),
            concurrency_key: concurrencyKey || null,
            updated_at: now.toISOString(),
          })
          .where('id', '=', existing.id)
          .where('status', '=', JobStatus.Waiting)
          .returningAll()
          .executeTakeFirst();

        return updatedJob ?? null;
      });

      if (result) {
        const date = new Date(result.scheduled_at);
        this.sleepScheduler.updateResolveTimeIfEarlier(JOB_LOOP_ID, date);
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
        status: JobStatus.Waiting,
        retries: 0,
        scheduled_at: scheduledAt.toISOString(),
        deduplication_key: opts?.deduplication?.key || null,
        concurrency_key: concurrencyKey || null,
        schedule_id: scheduleId || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .executeTakeFirst();

    if (job) {
      const date = new Date(job.scheduled_at);
      this.sleepScheduler.updateResolveTimeIfEarlier(JOB_LOOP_ID, date);
    }

    return job ?? null;
  }

  public async upsertJobSchedule(
    id: string,
    input: JobInput,
    interval: number,
    opts?: JobScheduleOptions
  ): Promise<SelectJobSchedule | null> {
    const now = new Date().toISOString();
    const nextRunAt = new Date(Date.parse(now) + interval).toISOString();

    const schedule = await this.app.database
      .insertInto('job_schedules')
      .returningAll()
      .values({
        id,
        queue: this.queue,
        input: this.toJSON(input),
        options: this.toJSON(opts),
        status: JobScheduleStatus.Active,
        interval: interval,
        next_run_at: nextRunAt,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc.columns(['id']).doUpdateSet({
          input: this.toJSON(input),
          options: this.toJSON(opts),
          interval: interval,
          next_run_at: nextRunAt,
          updated_at: now,
          status: JobScheduleStatus.Active,
        })
      )
      .executeTakeFirst();

    if (schedule) {
      const date = new Date(schedule.next_run_at);
      this.sleepScheduler.updateResolveTimeIfEarlier(SCHEDULE_LOOP_ID, date);
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
      .where('status', '=', JobScheduleStatus.Active)
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
        const date = new Date(Date.now() + JOBS_CONCURRENCY_TIMEOUT);
        await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, date);
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

      const now = new Date();
      const jobRow = await this.app.database
        .updateTable('jobs')
        .set({
          status: JobStatus.Active,
          updated_at: now.toISOString(),
        })
        .where('id', 'in', (qb) =>
          qb
            .selectFrom('jobs')
            .select('id')
            .where('queue', '=', this.queue)
            .where('status', '=', JobStatus.Waiting)
            .where('scheduled_at', '<=', now.toISOString())
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
          .where('status', '=', JobStatus.Waiting)
          .orderBy('scheduled_at', 'asc')
          .limit(1)
          .executeTakeFirst();

        if (nextScheduledJob) {
          const date = new Date(nextScheduledJob.scheduled_at);
          await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, date);
        } else {
          const date = new Date(now.getTime() + JOBS_MAX_TIMEOUT);
          await this.sleepScheduler.sleepUntil(JOB_LOOP_ID, date);
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
            .set({ status: JobStatus.Waiting, updated_at: now.toISOString() })
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
      const now = new Date();

      const schedules = await this.app.database
        .selectFrom('job_schedules')
        .selectAll()
        .where('status', '=', JobScheduleStatus.Active)
        .where('next_run_at', '<=', now.toISOString())
        .execute();

      for (const schedule of schedules) {
        try {
          await this.addJobFromSchedule(schedule);

          const nextRunAt = new Date(now.getTime() + schedule.interval);
          await this.app.database
            .updateTable('job_schedules')
            .set({
              next_run_at: nextRunAt.toISOString(),
              last_run_at: now.toISOString(),
              updated_at: now.toISOString(),
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
        .where('status', '=', JobScheduleStatus.Active)
        .orderBy('next_run_at', 'asc')
        .limit(1)
        .executeTakeFirst();

      if (nextSchedule) {
        const date = new Date(nextSchedule.next_run_at);
        await this.sleepScheduler.sleepUntil(SCHEDULE_LOOP_ID, date);
      } else {
        const date = new Date(now.getTime() + SCHEDULES_MAX_TIMEOUT);
        await this.sleepScheduler.sleepUntil(SCHEDULE_LOOP_ID, date);
      }
    }
  }

  private async addJobFromSchedule(schedule: SelectJobSchedule) {
    const input = this.fromJSON<JobInput>(schedule.input) as JobInput;
    const options = this.fromJSON<JobScheduleOptions>(schedule.options);

    return this.addJob(
      input,
      {
        retries: options?.retries,
        deduplication: options?.deduplication,
      },
      schedule.id
    );
  }

  private async handleJob(jobRow: SelectJob) {
    const options = this.fromJSON<JobOptions>(jobRow.options) ?? {};
    const input = this.fromJSON<JobInput>(jobRow.input) as JobInput;

    const job: Job = {
      id: jobRow.id,
      queue: jobRow.queue,
      input,
      options,
      status: jobRow.status,
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
        const retryAt = new Date(Date.now() + output.delay);
        await this.app.database
          .updateTable('jobs')
          .set({
            status: JobStatus.Waiting,
            scheduled_at: retryAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', jobRow.id)
          .where('status', '=', JobStatus.Active)
          .execute();
      } else if (output.type === 'cancel') {
        if (jobRow.schedule_id) {
          await this.removeJobSchedule(jobRow.schedule_id);
        }

        await this.app.database
          .deleteFrom('jobs')
          .where('id', '=', jobRow.id)
          .execute();
      } else if (output.type === 'success') {
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
        const retryAt = new Date(Date.now() + retryDelay);
        await this.app.database
          .updateTable('jobs')
          .set({
            status: JobStatus.Waiting,
            retries,
            scheduled_at: retryAt.toISOString(),
            updated_at: new Date().toISOString(),
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
