import { LocalNode } from '@colanode/client/types/nodes';

export type NodeTreeGetQueryInput = {
  type: 'node_tree_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    node_tree_get: {
      input: NodeTreeGetQueryInput;
      output: LocalNode[];
    };
  }
}
