import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { NodeReactionBatchListQueryInput } from '@colanode/client/queries/nodes/node-reaction-batch-list';
import { Event } from '@colanode/client/types/events';
import { NodeReaction } from '@colanode/client/types/nodes';

export class NodeReactionBatchListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeReactionBatchListQueryInput>
{
  public async handleQuery(
    input: NodeReactionBatchListQueryInput
  ): Promise<Record<string, NodeReaction[]>> {
    return this.fetchNodeReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: NodeReactionBatchListQueryInput,
    _: Record<string, NodeReaction[]>
  ): Promise<ChangeCheckResult<NodeReactionBatchListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: {},
      };
    }

    if (
      event.type === 'node.reaction.created' &&
      event.workspace.userId === input.userId &&
      input.nodeIds.includes(event.nodeReaction.nodeId)
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.reaction.deleted' &&
      event.workspace.userId === input.userId &&
      input.nodeIds.includes(event.nodeReaction.nodeId)
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.workspace.userId === input.userId &&
      input.nodeIds.includes(event.node.id)
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchNodeReactions(
    input: NodeReactionBatchListQueryInput
  ): Promise<Record<string, NodeReaction[]>> {
    if (input.nodeIds.length === 0) {
      return {};
    }

    const workspace = this.getWorkspace(input.userId);

    const reactions = await workspace.database
      .selectFrom('node_reactions')
      .selectAll()
      .where('node_id', 'in', input.nodeIds)
      .execute();

    const result: Record<string, NodeReaction[]> = {};

    for (const row of reactions) {
      const nodeId = row.node_id;
      if (!result[nodeId]) {
        result[nodeId] = [];
      }
      result[nodeId].push({
        nodeId: row.node_id,
        collaboratorId: row.collaborator_id,
        rootId: row.root_id,
        reaction: row.reaction,
        createdAt: row.created_at,
      });
    }

    return result;
  }
}
