export type ChannelUpdateMutationInput = {
  type: 'channel.update';
  userId: string;
  channelId: string;
  name: string;
  avatar?: string | null;
};

export type ChannelUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'channel.update': {
      input: ChannelUpdateMutationInput;
      output: ChannelUpdateMutationOutput;
    };
  }
}
