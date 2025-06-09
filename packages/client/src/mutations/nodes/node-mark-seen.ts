export type NodeMarkSeenMutationInput = {
  type: 'node.mark.seen';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type NodeMarkSeenMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.mark.seen': {
      input: NodeMarkSeenMutationInput;
      output: NodeMarkSeenMutationOutput;
    };
  }
}
