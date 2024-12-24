import { WorkspaceRole } from '../types/workspaces';

export type SyncUsersInput = {
  type: 'users';
};

export type SyncUserData = {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: WorkspaceRole;
  customName: string | null;
  customAvatar: string | null;
  createdAt: string;
  updatedAt: string | null;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    users: {
      input: SyncUsersInput;
      data: SyncUserData;
    };
  }
}