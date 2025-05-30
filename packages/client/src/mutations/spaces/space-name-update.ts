export type SpaceNameUpdateMutationInput = {
  type: 'space_name_update';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  name: string;
};

export type SpaceNameUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    space_name_update: {
      input: SpaceNameUpdateMutationInput;
      output: SpaceNameUpdateMutationOutput;
    };
  }
}
