import { NodeReaction } from '@colanode/client/types/nodes';

export type NodeReactionBatchListQueryInput = {
  type: 'node.reaction.batch-list';
  nodeIds: string[];
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.reaction.batch-list': {
      input: NodeReactionBatchListQueryInput;
      output: Record<string, NodeReaction[]>;
    };
  }
}
