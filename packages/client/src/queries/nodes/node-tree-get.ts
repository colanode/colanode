import { LocalNode } from '@colanode/client/types/nodes';

export type NodeTreeGetQueryInput = {
  type: 'node.tree.get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.tree.get': {
      input: NodeTreeGetQueryInput;
      output: LocalNode[];
    };
  }
}
