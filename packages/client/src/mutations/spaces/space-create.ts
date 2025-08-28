export type SpaceCreateMutationInput = {
  type: 'space.create';
  accountId: string;
  workspaceId: string;
  name: string;
  description: string;
  avatar?: string | null;
};

export type SpaceCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.create': {
      input: SpaceCreateMutationInput;
      output: SpaceCreateMutationOutput;
    };
  }
}
