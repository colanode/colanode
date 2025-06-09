import { FileState } from '@colanode/client/types/files';

export type FileStateGetQueryInput = {
  type: 'file.state.get';
  id: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.state.get': {
      input: FileStateGetQueryInput;
      output: FileState | null;
    };
  }
}
