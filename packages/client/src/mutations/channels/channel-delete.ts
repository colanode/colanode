export type ChannelDeleteMutationInput = {
  type: 'channel.delete';
  accountId: string;
  workspaceId: string;
  channelId: string;
};

export type ChannelDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'channel.delete': {
      input: ChannelDeleteMutationInput;
      output: ChannelDeleteMutationOutput;
    };
  }
}
