import { LocalChatNode } from '@colanode/client/types/nodes';

export type ChatListQueryInput = {
  type: 'chat.list';
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'chat.list': {
      input: ChatListQueryInput;
      output: LocalChatNode[];
    };
  }
}
