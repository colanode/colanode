import { NodeType } from '@colanode/core';

import { LocalNode } from '../../types/nodes';

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
