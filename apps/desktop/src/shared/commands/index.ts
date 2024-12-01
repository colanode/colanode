// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CommandMap {}

export type CommandInput = CommandMap[keyof CommandMap]['input'];
