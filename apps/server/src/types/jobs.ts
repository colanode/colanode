export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export type JobHandler<T extends JobInput> = (input: T) => Promise<void>;
