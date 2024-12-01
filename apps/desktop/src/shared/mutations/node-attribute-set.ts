export type NodeAttributeSetMutationInput = {
  type: 'node_attribute_set';
  userId: string;
  nodeId: string;
  path: string;
  value: unknown;
};

export type NodeAttributeSetMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    node_attribute_set: {
      input: NodeAttributeSetMutationInput;
      output: NodeAttributeSetMutationOutput;
    };
  }
}
