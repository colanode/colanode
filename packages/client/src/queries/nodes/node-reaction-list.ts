import { NodeReaction } from '@colanode/client/types/nodes';

export type NodeReactionListQueryInput = {
  type: 'node.reaction.list';
  nodeId: string;
  reaction: string;
  userId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.reaction.list': {
      input: NodeReactionListQueryInput;
      output: NodeReaction[];
    };
  }
}
