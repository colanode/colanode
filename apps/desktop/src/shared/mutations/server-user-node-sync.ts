import { ServerUserNodeState } from '@colanode/core';

export type ServerUserNodeSyncMutationInput = {
  type: 'server_user_node_sync';
  accountId: string;
  userNode: ServerUserNodeState;
};

export type ServerUserNodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    server_user_node_sync: {
      input: ServerUserNodeSyncMutationInput;
      output: ServerUserNodeSyncMutationOutput;
    };
  }
}
