import { LocalNode } from '@colanode/client/types/nodes';

export type NodeGetQueryInput = {
  type: 'node.get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.get': {
      input: NodeGetQueryInput;
      output: LocalNode | null;
    };
  }
}
