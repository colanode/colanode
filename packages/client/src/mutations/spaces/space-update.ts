export type SpaceUpdateMutationInput = {
  type: 'space.update';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  description: string;
  avatar?: string | null;
};

export type SpaceUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.update': {
      input: SpaceUpdateMutationInput;
      output: SpaceUpdateMutationOutput;
    };
  }
}
