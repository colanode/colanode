export type ChatCreateMutationInput = {
  type: 'chat_create';
  userId: string;
  otherUserId: string;
};

export type ChatCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    chat_create: {
      input: ChatCreateMutationInput;
      output: ChatCreateMutationOutput;
    };
  }
}