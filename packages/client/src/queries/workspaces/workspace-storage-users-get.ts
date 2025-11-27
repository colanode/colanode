import { WorkspaceStorageUser } from '@colanode/core';

export type WorkspaceStorageUsersGetQueryInput = {
  type: 'workspace.storage.users.get';
  userId: string;
  limit: number;
  cursor?: string;
};

export type WorkspaceStorageUsersGetQueryOutput = {
  users: WorkspaceStorageUser[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.storage.users.get': {
      input: WorkspaceStorageUsersGetQueryInput;
      output: WorkspaceStorageUsersGetQueryOutput;
    };
  }
}
