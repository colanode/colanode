export type WorkspaceDeleteMutationInput = {
  type: 'workspace_delete';
  accountId: string;
  workspaceId: string;
};

export type WorkspaceDeleteMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    workspace_delete: {
      input: WorkspaceDeleteMutationInput;
      output: WorkspaceDeleteMutationOutput;
    };
  }
}
