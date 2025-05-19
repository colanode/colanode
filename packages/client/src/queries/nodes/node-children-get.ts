import { LocalNode } from '@colanode/client/types/nodes';
import { NodeType } from '@colanode/core';

export type NodeChildrenGetQueryInput = {
  type: 'node_children_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
  types?: NodeType[];
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    node_children_get: {
      input: NodeChildrenGetQueryInput;
      output: LocalNode[];
    };
  }
}
