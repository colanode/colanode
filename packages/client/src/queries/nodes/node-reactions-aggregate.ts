import { NodeReactionCount } from '@colanode/client/types/nodes';

export type NodeReactionsAggregateQueryInput = {
  type: 'node_reactions_aggregate';
  nodeId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    node_reactions_aggregate: {
      input: NodeReactionsAggregateQueryInput;
      output: NodeReactionCount[];
    };
  }
}
