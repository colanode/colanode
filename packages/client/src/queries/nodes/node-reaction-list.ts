import { NodeReaction } from '@colanode/client/types/nodes';

export type NodeReactionListQueryInput = {
  type: 'node.reaction.list';
  nodeId: string;
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.reaction.list': {
      input: NodeReactionListQueryInput;
      output: NodeReaction[];
    };
  }
}
