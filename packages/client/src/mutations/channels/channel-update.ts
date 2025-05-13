export type ChannelUpdateMutationInput = {
  type: 'channel_update';
  accountId: string;
  workspaceId: string;
  channelId: string;
  name: string;
  avatar?: string | null;
};

export type ChannelUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    channel_update: {
      input: ChannelUpdateMutationInput;
      output: ChannelUpdateMutationOutput;
    };
  }
}
