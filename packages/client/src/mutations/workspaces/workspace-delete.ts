export type WorkspaceDeleteMutationInput = {
  type: 'workspace.delete';
  userId: string;
};

export type WorkspaceDeleteMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.delete': {
      input: WorkspaceDeleteMutationInput;
      output: WorkspaceDeleteMutationOutput;
    };
  }
}
