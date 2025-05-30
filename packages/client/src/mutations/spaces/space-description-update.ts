export type SpaceDescriptionUpdateMutationInput = {
  type: 'space_description_update';
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
    space_description_update: {
      input: SpaceDescriptionUpdateMutationInput;
      output: SpaceDescriptionUpdateMutationOutput;
    };
  }
}
