import { WorkspaceStorageGetOutput } from '@colanode/core';

export type WorkspaceStorageGetQueryInput = {
  type: 'workspace.storage.get';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.storage.get': {
      input: WorkspaceStorageGetQueryInput;
      output: WorkspaceStorageGetOutput;
    };
  }
}
