export type WorkspaceUpdateMutationInput = {
  type: 'workspace.update';
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  accountId: string;
};

export type WorkspaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.update': {
      input: WorkspaceUpdateMutationInput;
      output: WorkspaceUpdateMutationOutput;
    };
  }
}
