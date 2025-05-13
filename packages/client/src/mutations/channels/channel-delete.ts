export type ChannelDeleteMutationInput = {
  type: 'channel_delete';
  accountId: string;
  workspaceId: string;
  channelId: string;
};

export type ChannelDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    channel_delete: {
      input: ChannelDeleteMutationInput;
      output: ChannelDeleteMutationOutput;
    };
  }
}
