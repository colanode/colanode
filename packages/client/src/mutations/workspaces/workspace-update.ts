export type WorkspaceUpdateMutationInput = {
  type: 'workspace.update';
  id: string;
  name: string;
  description: string;
  avatar: string | null;
  userId: string;
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
