export type WorkspaceUserRoleUpdateMutationInput = {
  type: 'workspace_user_role_update';
  userToUpdateId: string;
  role: string;
  userId: string;
};

export type WorkspaceUserRoleUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    workspace_user_role_update: {
      input: WorkspaceUserRoleUpdateMutationInput;
      output: WorkspaceUserRoleUpdateMutationOutput;
    };
  }
}
