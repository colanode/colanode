export type ChannelCreateMutationInput = {
  type: 'channel.create';
  accountId: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  avatar?: string | null;
};

export type ChannelCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'channel.create': {
      input: ChannelCreateMutationInput;
      output: ChannelCreateMutationOutput;
    };
  }
}
