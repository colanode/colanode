import { JSONContent } from '@tiptap/core';

export type MessageCreateMutationInput = {
  type: 'message_create';
  userId: string;
  conversationId: string;
  content: JSONContent;
  referenceId?: string;
};

export type MessageCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    message_create: {
      input: MessageCreateMutationInput;
      output: MessageCreateMutationOutput;
    };
  }
}
