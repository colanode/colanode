import { LocalMessageNode } from '@colanode/client/types/nodes';

export type MessageListQueryInput = {
  type: 'message.list';
  conversationId: string;
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'message.list': {
      input: MessageListQueryInput;
      output: LocalMessageNode[];
    };
  }
}
