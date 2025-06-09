import { LocalNode } from '@colanode/client/types/nodes';
import { NodeType } from '@colanode/core';

export type NodeChildrenGetQueryInput = {
  type: 'node.children.get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
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
