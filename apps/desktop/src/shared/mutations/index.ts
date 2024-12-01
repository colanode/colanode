// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MutationMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];
