import { Job, JobsOptions,Queue, Worker } from 'bullmq';

import { redisConfig } from '@/data/redis';
import { jobHandlerMap } from '@/jobs';
import { JobHandler, JobInput } from '@/types/jobs';

class JobService {
  private jobQueue: Queue | undefined;
  private jobWorker: Worker | undefined;

  public initQueue() {
    if (this.jobQueue) {
      return;
    }

    this.jobQueue = new Queue('jobs', {
      connection: {
        host: redisConfig.host,
        password: redisConfig.password,
        port: redisConfig.port,
        db: redisConfig.db,
      },
      defaultJobOptions: {
        removeOnComplete: true,
      },
    });
  }

  public async initWorker() {
    if (this.jobWorker) {
      return;
    }

    this.jobWorker = new Worker('jobs', this.handleJobJob, {
      connection: {
        host: redisConfig.host,
        password: redisConfig.password,
        port: redisConfig.port,
        db: redisConfig.db,
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
  };
}

export const jobService = new JobService();
