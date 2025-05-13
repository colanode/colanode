export type NodeReactionDeleteMutationInput = {
  type: 'node_reaction_delete';
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
    node_reaction_delete: {
      input: NodeReactionDeleteMutationInput;
      output: NodeReactionDeleteMutationOutput;
    };
  }
}
