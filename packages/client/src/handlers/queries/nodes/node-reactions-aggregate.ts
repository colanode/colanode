import { sql } from 'kysely';

import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { NodeReactionsAggregateQueryInput } from '@colanode/client/queries/nodes/node-reactions-aggregate';
import { Event } from '@colanode/client/types/events';
import { NodeReactionCount } from '@colanode/client/types/nodes';

interface NodeReactionsAggregateRow {
  reaction: string;
  count: number;
  reacted: number;
}

export class NodeReactionsAggregateQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeReactionsAggregateQueryInput>
{
  public async handleQuery(
    input: NodeReactionsAggregateQueryInput
  ): Promise<NodeReactionCount[]> {
    return this.fetchNodeReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: NodeReactionsAggregateQueryInput,
    _: NodeReactionCount[]
  ): Promise<ChangeCheckResult<NodeReactionsAggregateQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node.reaction.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.nodeReaction.nodeId === input.nodeId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.reaction.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.nodeReaction.nodeId === input.nodeId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.nodeId
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchNodeReactions(
    input: NodeReactionsAggregateQueryInput
  ): Promise<NodeReactionCount[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await sql<NodeReactionsAggregateRow>`
      SELECT 
        reaction,
        COUNT(reaction) as count,
        MAX(CASE 
          WHEN collaborator_id = ${workspace.userId} THEN 1 
          ELSE 0 
        END) as reacted
      FROM node_reactions
      WHERE node_id = ${input.nodeId}
      GROUP BY reaction
    `.execute(workspace.database);

    if (result.rows.length === 0) {
      return [];
    }

    const counts = result.rows.map((row) => {
      return {
        reaction: row.reaction,
        count: row.count,
        reacted: row.reacted === 1,
      };
    });

    return counts;
  }
}
