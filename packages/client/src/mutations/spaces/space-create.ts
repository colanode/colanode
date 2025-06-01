export type SpaceCreateMutationInput = {
  type: 'space_create';
  accountId: string;
  workspaceId: string;
  name: string;
  description: string;
};

export type SpaceCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    space_create: {
      input: SpaceCreateMutationInput;
      output: SpaceCreateMutationOutput;
    };
  }
}
