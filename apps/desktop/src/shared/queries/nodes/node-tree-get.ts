import { Node } from '@colanode/core';

export type NodeTreeGetQueryInput = {
  type: 'node_tree_get';
  nodeId: string;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    node_tree_get: {
      input: NodeTreeGetQueryInput;
      output: Node[];
    };
  }
}
