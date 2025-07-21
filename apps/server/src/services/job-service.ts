import { Job, JobsOptions, Queue, Worker } from 'bullmq';

import { jobHandlerMap, JobHandler, JobInput } from '@colanode/server/jobs';
import { config } from '@colanode/server/lib/config';
import { createLogger } from '@colanode/server/lib/logger';

const logger = createLogger('server:service:job');

class JobService {
  private jobQueue: Queue | undefined;
  private jobWorker: Worker | undefined;

  // Bullmq performs atomic operations across different keys, which can cause
  // issues with Redis clusters, so we wrap the prefix in curly braces to
  // ensure that all keys are in the same slot (Redis node)

  // for more information, see: https://docs.bullmq.io/bull/patterns/redis-cluster

  private readonly queueName = config.redis.jobs.name;
  private readonly prefix = `{${config.redis.jobs.prefix}}`;

  public initQueue() {
    if (this.jobQueue) {
      return;
    }

    this.jobQueue = new Queue(this.queueName, {
      prefix: this.prefix,
      connection: {
        db: config.redis.db,
        url: config.redis.url,
      },
      defaultJobOptions: {
        removeOnComplete: true,
      },
    });

    this.jobQueue.on('error', (error) => {
      logger.error(error, `Job queue error`);
    });

    if (config.ai.enabled) {
      this.jobQueue.upsertJobScheduler(
        'node.embed.scan',
        { pattern: '0 */30 * * * *' },
        {
          name: 'node.embed.scan',
          data: { type: 'node.embed.scan' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 5,
            removeOnFail: 1000,
          },
        }
      );

      this.jobQueue.upsertJobScheduler(
        'document.embed.scan',
        { pattern: '0 */30 * * * *' },
        {
          name: 'document.embed.scan',
          data: { type: 'document.embed.scan' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 5,
            removeOnFail: 1000,
          },
        }
      );
    }

    if (config.jobs.nodeUpdatesMerge.enabled) {
      this.jobQueue.upsertJobScheduler(
        'node.updates.merge',
        { pattern: config.jobs.nodeUpdatesMerge.cron },
        {
          name: 'node.updates.merge',
          data: { type: 'node.updates.merge' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 3,
            removeOnFail: 100,
          },
        }
      );
    } else {
      this.jobQueue.removeJobScheduler('node.updates.merge');
    }

    if (config.jobs.documentUpdatesMerge.enabled) {
      this.jobQueue.upsertJobScheduler(
        'document.updates.merge',
        { pattern: config.jobs.documentUpdatesMerge.cron },
        {
          name: 'document.updates.merge',
          data: { type: 'document.updates.merge' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 3,
            removeOnFail: 100,
          },
        }
      );
    } else {
      this.jobQueue.removeJobScheduler('document.updates.merge');
    }
  }

  public async initWorker() {
    if (this.jobWorker) {
      return;
    }

    this.jobWorker = new Worker(this.queueName, this.handleJobJob, {
      prefix: this.prefix,
      connection: {
        url: config.redis.url,
        db: config.redis.db,
      },
    });
  }

  public async addJob(job: JobInput, options?: JobsOptions) {
    if (!this.jobQueue) {
      throw new Error('Job queue not initialized.');
    }

    await this.jobQueue.add(job.type, job, options);
  }

  private handleJobJob = async (job: Job) => {
    const input = job.data as JobInput;
    const handler = jobHandlerMap[input.type] as JobHandler<typeof input>;
    if (!handler) {
      if (job.opts.repeat && job.repeatJobKey) {
        await this.jobQueue?.removeJobScheduler(job.repeatJobKey);
        logger.warn(
          `Removed recurring job ${job.id} with type ${input.type} as no handler was found.`
        );
      }

      logger.warn(`Job ${job.id} with type ${input.type} not found.`);
      return;
    }

    await handler(input);

    logger.debug(`Job ${job.id} with type ${input.type} completed.`);
  };
}

export const jobService = new JobService();
