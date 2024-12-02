export type ChannelCreateMutationInput = {
  type: 'channel_create';
  userId: string;
  spaceId: string;
  name: string;
  avatar?: string | null;
};

export type ChannelCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    channel_create: {
      input: ChannelCreateMutationInput;
      output: ChannelCreateMutationOutput;
    };
  }
}
