import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { NodeChildrenGetQueryInput } from '@colanode/client/queries/nodes/node-children-get';
import { Event } from '@colanode/client/types/events';
import { LocalNode } from '@colanode/client/types/nodes';

export class NodeChildrenGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeChildrenGetQueryInput>
{
  public async handleQuery(
    input: NodeChildrenGetQueryInput
  ): Promise<LocalNode[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapNode) as LocalNode[];
  }

  public async checkForChanges(
    event: Event,
    input: NodeChildrenGetQueryInput,
    output: LocalNode[]
  ): Promise<ChangeCheckResult<NodeChildrenGetQueryInput>> {
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
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.nodeId &&
      (input.types === undefined || input.types.includes(event.node.type))
    ) {
      const newChildren = [...output, event.node];
      return {
        hasChanges: true,
        result: newChildren,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.nodeId &&
      (input.types === undefined || input.types.includes(event.node.type))
    ) {
      const node = output.find((n) => n.id === event.node.id);
      if (node) {
        const newChildren = output.map((node) =>
          node.id === event.node.id ? event.node : node
        );

        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.nodeId &&
      (input.types === undefined || input.types.includes(event.node.type))
    ) {
      const node = output.find((n) => n.id === event.node.id);
      if (node) {
        const newChildren = output.filter((n) => n.id !== event.node.id);
        return {
          hasChanges: true,
          result: newChildren,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchChildren(
    input: NodeChildrenGetQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const rows = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.nodeId)
      .where('type', 'in', input.types ?? [])
      .execute();

    return rows;
  }
}
