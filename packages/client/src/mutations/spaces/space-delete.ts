export type SpaceDeleteMutationInput = {
  type: 'space.delete';
  userId: string;
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
