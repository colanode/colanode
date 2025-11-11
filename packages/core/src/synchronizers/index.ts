export * from './node-updates';
export * from './users';
export * from './node-reactions';
export * from './node-interactions';
export * from './node-tombstones';
export * from './collaborations';
export * from './document-updates';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SynchronizerMap {}

export type SynchronizerInput = SynchronizerMap[keyof SynchronizerMap]['input'];
