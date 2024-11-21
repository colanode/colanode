export type ChannelUpdateMutationInput = {
  type: 'channel_update';
  userId: string;
  channelId: string;
  name: string;
  avatar?: string | null;
};

export type ChannelUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    channel_update: {
      input: ChannelUpdateMutationInput;
      output: ChannelUpdateMutationOutput;
    };
  }
}
