import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { NodeTreeGetQueryInput } from '../../../queries/nodes/node-tree-get';
import { Event } from '../../../types/events';
import { WorkspaceQueryHandlerBase } from '../workspace-query-handler-base';
import { fetchNodeTree } from '../../../lib/utils';
import { LocalNode } from '../../../types/nodes';

export class NodeTreeGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeTreeGetQueryInput>
{
  public async handleQuery(input: NodeTreeGetQueryInput): Promise<LocalNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const tree = await fetchNodeTree(workspace.database, input.nodeId);
    return tree;
  }

  public async checkForChanges(
    event: Event,
    input: NodeTreeGetQueryInput,
    output: LocalNode[]
  ): Promise<ChangeCheckResult<NodeTreeGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node_created' &&
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
      event.type === 'node_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const node = output.find((n) => n.id === event.node.id);
      if (node) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const node = output.find((n) => n.id === event.node.id);
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
      result: output,
    };
  }
}
