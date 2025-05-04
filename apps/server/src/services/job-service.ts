import { Job, JobsOptions, Queue, Worker } from 'bullmq';
import { createDebugger } from '@colanode/core';

import { config } from '@/lib/config';
import { jobHandlerMap } from '@/jobs';
import { JobHandler, JobInput } from '@/types/jobs';

const debug = createDebugger('server:service:job');

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
      debug(`Job queue error: ${error}`);
    });

    if (config.ai.enabled) {
      this.jobQueue.upsertJobScheduler(
        'check_node_embeddings',
        { pattern: '0 */30 * * * *' },
        {
          name: 'check_node_embeddings',
          data: { type: 'check_node_embeddings' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 5,
            removeOnFail: 1000,
          },
        }
      );

      this.jobQueue.upsertJobScheduler(
        'check_document_embeddings',
        { pattern: '0 */30 * * * *' },
        {
          name: 'check_document_embeddings',
          data: { type: 'check_document_embeddings' } as JobInput,
          opts: {
            backoff: 3,
            attempts: 5,
            removeOnFail: 1000,
          },
        }
      );
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
    await handler(input);

    debug(`Job ${job.id} with type ${input.type} completed.`);
  };
}

export const jobService = new JobService();
