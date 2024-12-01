// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QueryMap {}

export type QueryInput = QueryMap[keyof QueryMap]['input'];
