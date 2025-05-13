import { LocalNode } from '../../types/nodes';

export type NodeGetQueryInput = {
  type: 'node_get';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    node_get: {
      input: NodeGetQueryInput;
      output: LocalNode | null;
    };
  }
}
