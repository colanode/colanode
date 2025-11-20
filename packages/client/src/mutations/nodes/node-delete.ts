export type NodeDeleteMutationInput = {
  type: 'node.delete';
  userId: string;
  nodeId: string;
};

export type NodeDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.delete': {
      input: NodeDeleteMutationInput;
      output: NodeDeleteMutationOutput;
    };
  }
}
