import { SelectNode } from '@colanode/client/databases';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { NodeGetQueryInput } from '@colanode/client/queries/nodes/node-get';
import { Event } from '@colanode/client/types/events';
import { LocalNode } from '@colanode/client/types/nodes';

export class NodeGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeGetQueryInput>
{
  public async handleQuery(
    input: NodeGetQueryInput
  ): Promise<LocalNode | null> {
    const row = await this.fetchNode(input);
    return row ? mapNode(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: NodeGetQueryInput,
    _: LocalNode | null
  ): Promise<ChangeCheckResult<NodeGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.created' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.node,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.node,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchNode(
    input: NodeGetQueryInput
  ): Promise<SelectNode | undefined> {
    const workspace = this.getWorkspace(input.userId);

    const row = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.nodeId)
      .executeTakeFirst();

    return row;
  }
}
