import { LocalMessageNode } from '@colanode/client/types/nodes';

export type MessageSearchQueryInput = {
  type: 'message.search';
  userId: string;
  conversationId: string;
  threadRootMessageId?: string;
  searchQuery?: string;
  fromCreatedAt?: string;
  toCreatedAt?: string;
  limit?: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'message.search': {
      input: MessageSearchQueryInput;
      output: LocalMessageNode[];
    };
  }
}