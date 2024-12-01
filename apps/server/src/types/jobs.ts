// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export type JobHandler<T extends JobInput> = (input: T) => Promise<void>;
