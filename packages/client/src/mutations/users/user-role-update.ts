import { WorkspaceRole } from '@colanode/core';

export type UserRoleUpdateMutationInput = {
  type: 'user.role.update';
  accountId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export type UserRoleUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'user.role.update': {
      input: UserRoleUpdateMutationInput;
      output: UserRoleUpdateMutationOutput;
    };
  }
}
