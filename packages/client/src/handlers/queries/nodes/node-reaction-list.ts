import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { NodeReactionListQueryInput } from '@colanode/client/queries/nodes/node-reaction-list';
import { Event } from '@colanode/client/types/events';
import { NodeReaction } from '@colanode/client/types/nodes';

export class NodeReactionsListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeReactionListQueryInput>
{
  public async handleQuery(
    input: NodeReactionListQueryInput
  ): Promise<NodeReaction[]> {
    return this.fetchNodeReactions(input);
  }

  public async checkForChanges(
    event: Event,
    input: NodeReactionListQueryInput,
    _: NodeReaction[]
  ): Promise<ChangeCheckResult<NodeReactionListQueryInput>> {
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
    input: NodeReactionListQueryInput
  ): Promise<NodeReaction[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const reactions = await workspace.database
      .selectFrom('node_reactions')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .where('reaction', '=', input.reaction)
      .orderBy('created_at', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return reactions.map((row) => {
      return {
        nodeId: row.node_id,
        collaboratorId: row.collaborator_id,
        rootId: row.root_id,
        reaction: row.reaction,
        createdAt: row.created_at,
      };
    });
  }
}
