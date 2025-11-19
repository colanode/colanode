import { LocalNode } from '@colanode/client/types/nodes';
import { NodeType } from '@colanode/core';

export type NodeChildrenGetQueryInput = {
  type: 'node.children.get';
  nodeId: string;
  userId: string;
  types?: NodeType[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.children.get': {
      input: NodeChildrenGetQueryInput;
      output: LocalNode[];
    };
  }
}
