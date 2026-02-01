export type WorkspaceUpdateMutationInput = {
  type: 'workspace.update';
  userId: string;
  name: string;
  description: string;
  avatar: string | null;
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
