import { WorkspaceRole } from '@colanode/core';

export type WorkspaceUsersInviteMutationInput = {
  type: 'workspace_users_invite';
  emails: string[];
  userId: string;
  role: WorkspaceRole;
};

export type WorkspaceUsersInviteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    workspace_users_invite: {
      input: WorkspaceUsersInviteMutationInput;
      output: WorkspaceUsersInviteMutationOutput;
    };
  }
}
