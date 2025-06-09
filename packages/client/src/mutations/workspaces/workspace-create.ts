export type WorkspaceCreateMutationInput = {
  type: 'workspace.create';
  name: string;
  description: string;
  accountId: string;
  avatar: string | null;
};

export type WorkspaceCreateMutationOutput = {
  id: string;
  userId: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.create': {
      input: WorkspaceCreateMutationInput;
      output: WorkspaceCreateMutationOutput;
    };
  }
}
