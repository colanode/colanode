export type NodeMarkOpenedMutationInput = {
  type: 'node.mark.opened';
  accountId: string;
  workspaceId: string;
  nodeId: string;
};

export type NodeMarkOpenedMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.mark.opened': {
      input: NodeMarkOpenedMutationInput;
      output: NodeMarkOpenedMutationOutput;
    };
  }
}
