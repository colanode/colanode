export type NodeReactionDeleteMutationInput = {
  type: 'node.reaction.delete';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  reaction: string;
};

export type NodeReactionDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.reaction.delete': {
      input: NodeReactionDeleteMutationInput;
      output: NodeReactionDeleteMutationOutput;
    };
  }
}
