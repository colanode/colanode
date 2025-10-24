import { LocalNode } from '@colanode/client/types';

export type NodeCreateMutationInput = {
  type: 'node.create';
  userId: string;
  node: LocalNode;
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
