import { NodeReaction } from '@colanode/client/types/nodes';

export type NodeReactionListQueryInput = {
  type: 'node_reaction_list';
  nodeId: string;
  reaction: string;
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    node_reaction_list: {
      input: NodeReactionListQueryInput;
      output: NodeReaction[];
    };
  }
}
