import { WorkspaceRole } from '@colanode/core';

export type UsersInviteMutationInput = {
  type: 'users_invite';
  accountId: string;
  workspaceId: string;
  emails: string[];
  role: WorkspaceRole;
};

export type UsersInviteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    users_invite: {
      input: UsersInviteMutationInput;
      output: UsersInviteMutationOutput;
    };
  }
}
