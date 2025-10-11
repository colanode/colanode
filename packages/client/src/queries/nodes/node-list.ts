import { LocalNode } from '@colanode/client/types/nodes';

export type NodeListQueryInput = {
  type: 'node.list';
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.list': {
      input: NodeListQueryInput;
      output: LocalNode[];
    };
  }
}
