export enum JobStatus {
  Waiting = 1,
  Active = 2,
}

export enum JobScheduleStatus {
  Active = 1,
  Paused = 2,
}

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
  deduplication?: JobDeduplicationOptions;
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
  createdAt: string;
  updatedAt: string;
  scheduledAt: string;
};

export type JobSchedule = {
  id: string;
  input: JobInput;
  options: JobScheduleOptions;
  status: JobScheduleStatus;
  interval: number;
  nextRunAt: string;
  lastRunAt?: string;
  queue: string;
  createdAt: string;
  updatedAt: string;
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
