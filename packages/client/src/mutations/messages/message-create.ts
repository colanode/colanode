import { JSONContent } from '@tiptap/core';

export type MessageCreateMutationInput = {
  type: 'message_create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  content: JSONContent;
  referenceId?: string;
};

export type MessageCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    message_create: {
      input: MessageCreateMutationInput;
      output: MessageCreateMutationOutput;
    };
  }
}
