export type WorkspaceUpdateMutationInput = {
  type: 'workspace_update';
  id: string;
  name: string;
  description: string;
  accountId: string;
};

export type WorkspaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    workspace_update: {
      input: WorkspaceUpdateMutationInput;
      output: WorkspaceUpdateMutationOutput;
    };
  }
}