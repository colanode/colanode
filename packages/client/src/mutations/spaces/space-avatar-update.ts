export type SpaceAvatarUpdateMutationInput = {
  type: 'space.avatar.update';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  avatar: string;
};

export type SpaceAvatarUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'space.avatar.update': {
      input: SpaceAvatarUpdateMutationInput;
      output: SpaceAvatarUpdateMutationOutput;
    };
  }
}
