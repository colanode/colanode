export type SpaceDescriptionUpdateMutationInput = {
  type: 'space.description.update';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  description: string;
};

export type SpaceDescriptionUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.description.update': {
      input: SpaceDescriptionUpdateMutationInput;
      output: SpaceDescriptionUpdateMutationOutput;
    };
  }
}
