export type MessageReactionDeleteMutationInput = {
  type: 'message_reaction_delete';
  userId: string;
  messageId: string;
  reaction: string;
};

export type MessageReactionDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    message_reaction_delete: {
      input: MessageReactionDeleteMutationInput;
      output: MessageReactionDeleteMutationOutput;
    };
  }
}
