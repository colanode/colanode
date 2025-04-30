import { WorkspaceRole } from '@colanode/core';

export type UserRoleUpdateMutationInput = {
  type: 'user_role_update';
  accountId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export type UserRoleUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    user_role_update: {
      input: UserRoleUpdateMutationInput;
      output: UserRoleUpdateMutationOutput;
    };
  }
}
