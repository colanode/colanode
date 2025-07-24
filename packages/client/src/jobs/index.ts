export type JobStatus = 'waiting' | 'active';

export type JobScheduleStatus = 'active' | 'paused';

export type JobDeduplicationOptions = {
  key: string;
  replace?: boolean;
};

export type JobOptions = {
  retries?: number;
  delay?: number;
  deduplication?: JobDeduplicationOptions;
};

export type JobScheduleOptions = {
  retries?: number;
};

export type Job = {
  id: string;
  input: JobInput;
  options: JobOptions;
  status: JobStatus;
  retries: number;
  queue: string;
  deduplicationKey?: string;
  concurrencyKey?: string;
  createdAt: number;
  updatedAt: number;
  scheduledAt: number;
};

export type JobSchedule = {
  id: string;
  input: JobInput;
  options: JobScheduleOptions;
  status: JobScheduleStatus;
  interval: number;
  nextRunAt: number;
  lastRunAt?: number;
  queue: string;
  createdAt: number;
  updatedAt: number;
};

export type JobManagerOptions = {
  concurrency?: number;
  interval?: number;
};

export type JobConcurrencyConfig<T extends JobInput> = {
  limit: number;
  key: (input: T) => string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export type JobSuccessOutput = {
  type: 'success';
};

export type JobRetryOutput = {
  type: 'retry';
  delay: number;
};

export type JobCancelOutput = {
  type: 'cancel';
};

export type JobOutput = JobSuccessOutput | JobRetryOutput | JobCancelOutput;

export interface JobHandler<T extends JobInput> {
  handleJob: (input: T) => Promise<JobOutput>;
  concurrency?: JobConcurrencyConfig<T>;
}

export type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};
