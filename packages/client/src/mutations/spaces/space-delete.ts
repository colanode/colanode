export type SpaceDeleteMutationInput = {
  type: 'space_delete';
  accountId: string;
  workspaceId: string;
  spaceId: string;
};

export type SpaceDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    space_delete: {
      input: SpaceDeleteMutationInput;
      output: SpaceDeleteMutationOutput;
    };
  }
}
