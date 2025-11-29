export type NodeReactionCreateMutationInput = {
  type: 'node.reaction.create';
  userId: string;
  nodeId: string;
  reaction: string;
};

export type NodeReactionCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.reaction.create': {
      input: NodeReactionCreateMutationInput;
      output: NodeReactionCreateMutationOutput;
    };
  }
}
