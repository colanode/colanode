import { FileState } from '@colanode/client/types/files';

export type FileStateGetQueryInput = {
  type: 'file_state_get';
  id: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    file_state_get: {
      input: FileStateGetQueryInput;
      output: FileState | null;
    };
  }
}
