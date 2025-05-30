export type NodeReactionCreateMutationInput = {
  type: 'node_reaction_create';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  reaction: string;
};

export type NodeReactionCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    node_reaction_create: {
      input: NodeReactionCreateMutationInput;
      output: NodeReactionCreateMutationOutput;
    };
  }
}
