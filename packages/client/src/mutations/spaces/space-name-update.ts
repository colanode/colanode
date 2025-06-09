export type SpaceNameUpdateMutationInput = {
  type: 'space.name.update';
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
    'space.name.update': {
      input: SpaceNameUpdateMutationInput;
      output: SpaceNameUpdateMutationOutput;
    };
  }
}
