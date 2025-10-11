import { SelectNode } from '@colanode/client/databases';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { NodeListQueryInput } from '@colanode/client/queries/nodes/node-list';
import { Event } from '@colanode/client/types/events';
import { LocalNode } from '@colanode/client/types/nodes';

export class NodeListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeListQueryInput>
{
  public async handleQuery(input: NodeListQueryInput): Promise<LocalNode[]> {
    const rows = await this.fetchNodes(input);
    return rows.map(mapNode);
  }

  public async checkForChanges(
    event: Event,
    input: NodeListQueryInput,
    output: LocalNode[]
  ): Promise<ChangeCheckResult<NodeListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node.created' &&
      event.workspace.userId === input.userId
    ) {
      const newResult = [...output, event.node];
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.workspace.userId === input.userId
    ) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newResult = output.map((node) =>
          node.id === event.node.id ? event.node : node
        );

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.workspace.userId === input.userId
    ) {
      const node = output.find((node) => node.id === event.node.id);
      if (node) {
        const newResult = output.filter((node) => node.id !== event.node.id);

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

  private async fetchNodes(input: NodeListQueryInput): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.userId);

    const rows = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .execute();

    return rows;
  }
}
