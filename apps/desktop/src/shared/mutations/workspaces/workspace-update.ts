export type WorkspaceUpdateMutationInput = {
  type: 'workspace_update';
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  accountId: string;
};

export type WorkspaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    workspace_update: {
      input: WorkspaceUpdateMutationInput;
      output: WorkspaceUpdateMutationOutput;
    };
  }
}
