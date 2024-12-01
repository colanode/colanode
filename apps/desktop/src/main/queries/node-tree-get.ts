import { databaseService } from '@/main/data/database-service';
import { mapNode, fetchNodeAncestors } from '@/main/utils';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { NodeTreeGetQueryInput } from '@/shared/queries/node-tree-get';
import { Event } from '@/shared/types/events';
import { Node } from '@colanode/core';

export class NodeTreeGetQueryHandler
  implements QueryHandler<NodeTreeGetQueryInput>
{
  public async handleQuery(input: NodeTreeGetQueryInput): Promise<Node[]> {
    const rows = await this.fetchNodes(input);
    return rows.map(mapNode);
  }

  public async checkForChanges(
    event: Event,
    input: NodeTreeGetQueryInput,
    output: Node[]
  ): Promise<ChangeCheckResult<NodeTreeGetQueryInput>> {
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
      event.node.id === input.nodeId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (event.type === 'node_updated' && event.userId === input.userId) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newNodes = output.map((node) => {
          if (node.id === event.node.id) {
            return event.node;
          }
          return node;
        });

        return {
          hasChanges: true,
          result: newNodes,
        };
      }
    }

    if (event.type === 'node_deleted' && event.userId === input.userId) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchNodes(
    input: NodeTreeGetQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const rows = await fetchNodeAncestors(workspaceDatabase, input.nodeId);
    if (rows.length === 0) {
      return [];
    }

    const result: SelectNode[] = [];

    let node = rows.find((row) => row.id === input.nodeId);
    if (!node) {
      return [];
    }

    while (node) {
      result.unshift(node);
      node = rows.find((row) => row.id === node?.parent_id);

      if (!node || node.id === node.parent_id) {
        break;
      }
    }

    return result;
  }
}
