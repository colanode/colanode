export * from './file-dialog-open';
export * from './file-open';
export * from './url-open';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CommandMap {}

export type CommandInput = CommandMap[keyof CommandMap]['input'];

export class CommandError extends Error {
  constructor(
    public code: CommandErrorCode,
    message: string
  ) {
    super(message);
  }
}

export enum CommandErrorCode {
  Unknown = 'unknown',
  AccountNotFound = 'account_not_found',
  WorkspaceNotFound = 'workspace_not_found',
}
