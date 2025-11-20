import { SelectNode } from '@colanode/client/databases';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { NodeListQueryInput } from '@colanode/client/queries/nodes/node-list';
import { LocalNode } from '@colanode/client/types/nodes';

export class NodeListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<NodeListQueryInput>
{
  public async handleQuery(input: NodeListQueryInput): Promise<LocalNode[]> {
    const rows = await this.fetchNodes(input);
    return rows.map(mapNode) as LocalNode[];
  }

  public async checkForChanges(): Promise<
    ChangeCheckResult<NodeListQueryInput>
  > {
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
