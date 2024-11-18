import { ServerNodeState } from '@colanode/core';

export type ServerNodeSyncMutationInput = {
  type: 'server_node_sync';
  accountId: string;
  node: ServerNodeState;
};

export type ServerNodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    server_node_sync: {
      input: ServerNodeSyncMutationInput;
      output: ServerNodeSyncMutationOutput;
    };
  }
}
