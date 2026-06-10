import { LocalNode } from '@colanode/client/types/nodes';

export type TagNodeItem = {
  node: LocalNode;
  parent: LocalNode | null;
};

export type TagNodesListQueryInput = {
  type: 'tag.nodes.list';
  userId: string;
  tagId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'tag.nodes.list': {
      input: TagNodesListQueryInput;
      output: TagNodeItem[];
    };
  }
}
