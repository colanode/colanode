import { NodeAttributes } from '@colanode/core';

export type NodeCreateMutationInput = {
  type: 'node.create';
  userId: string;
  nodeId: string;
  attributes: NodeAttributes;
};

export type NodeCreateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'node.create': {
      input: NodeCreateMutationInput;
      output: NodeCreateMutationOutput;
    };
  }
}
