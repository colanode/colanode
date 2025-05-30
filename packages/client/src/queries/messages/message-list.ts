import { LocalMessageNode } from '@colanode/client/types/nodes';

export type MessageListQueryInput = {
  type: 'message_list';
  conversationId: string;
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    message_list: {
      input: MessageListQueryInput;
      output: LocalMessageNode[];
    };
  }
}
