import { WorkspaceStorageGetOutput } from '@colanode/core';

export type WorkspaceStorageGetQueryInput = {
  type: 'workspace.storage.get';
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.storage.get': {
      input: WorkspaceStorageGetQueryInput;
      output: WorkspaceStorageGetOutput;
    };
  }
}
