import { Node } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { NodeChildrenGetQueryInput } from '@/shared/queries/node-children-get';
import { Event } from '@/shared/types/events';

export class NodeChildrenGetQueryHandler
  implements QueryHandler<NodeChildrenGetQueryInput>
{
  public async handleQuery(input: NodeChildrenGetQueryInput): Promise<Node[]> {
    const rows = await this.fetchChildren(input);
    return rows.map(mapNode);
  }

  public async checkForChanges(
    event: Event,
    input: NodeChildrenGetQueryInput,
    output: Node[]
  ): Promise<ChangeCheckResult<NodeChildrenGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
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
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.parentId === input.nodeId &&
      (input.types === undefined || input.types.includes(event.node.type))
    ) {
      const node = output.find((node) => node.id === event.node.id);
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
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.parentId === input.nodeId &&
      (input.types === undefined || input.types.includes(event.node.type))
    ) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newChildren = output.filter((node) => node.id !== event.node.id);
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
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('parent_id', '=', input.nodeId)
      .where('type', 'in', input.types ?? [])
      .execute();

    return rows;
  }
}
