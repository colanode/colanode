// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MutationMap {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MutationErrorMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];
