export type NodeInteractionSeenMutationInput = {
  type: 'node.interaction.seen';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type NodeInteractionSeenMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.interaction.seen': {
      input: NodeInteractionSeenMutationInput;
      output: NodeInteractionSeenMutationOutput;
    };
  }
}
