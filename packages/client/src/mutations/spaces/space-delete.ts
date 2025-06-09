export type SpaceDeleteMutationInput = {
  type: 'space.delete';
  accountId: string;
  workspaceId: string;
  spaceId: string;
};

export type SpaceDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.delete': {
      input: SpaceDeleteMutationInput;
      output: SpaceDeleteMutationOutput;
    };
  }
}
