import { NodeReactionCount } from '@colanode/client/types/nodes';

export type NodeReactionsAggregateQueryInput = {
  type: 'node.reactions.aggregate';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.reactions.aggregate': {
      input: NodeReactionsAggregateQueryInput;
      output: NodeReactionCount[];
    };
  }
}
