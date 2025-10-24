import { NodeAttributes } from '@colanode/core';

export type NodeUpdateMutationInput = {
  type: 'node.update';
  userId: string;
  nodeId: string;
  attributes: Partial<NodeAttributes>;
};

export type NodeUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.update': {
      input: NodeUpdateMutationInput;
      output: NodeUpdateMutationOutput;
    };
  }
}
