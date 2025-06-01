export type NodeMarkSeenMutationInput = {
  type: 'node_mark_seen';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type NodeMarkSeenMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    node_mark_seen: {
      input: NodeMarkSeenMutationInput;
      output: NodeMarkSeenMutationOutput;
    };
  }
}
