import { compareString } from '@colanode/core';

import { SelectNode } from '../../../databases/workspace';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapNode } from '../../../lib/mappers';
import { DatabaseViewListQueryInput } from '../../../queries/databases/database-view-list';
import { Event } from '../../../types/events';
import { WorkspaceQueryHandlerBase } from '../workspace-query-handler-base';
import { LocalDatabaseViewNode } from '../../../types/nodes';

export class DatabaseViewListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DatabaseViewListQueryInput>
{
  public async handleQuery(
    input: DatabaseViewListQueryInput
  ): Promise<LocalDatabaseViewNode[]> {
    const databaseViews = await this.fetchDatabaseViews(input);
    const databaseViewNodes = databaseViews.map(
      mapNode
    ) as LocalDatabaseViewNode[];
    return databaseViewNodes.sort((a, b) => compareString(a.id, b.id));
  }

  public async checkForChanges(
    event: Event,
    input: DatabaseViewListQueryInput,
    output: LocalDatabaseViewNode[]
  ): Promise<ChangeCheckResult<DatabaseViewListQueryInput>> {
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
      event.node.type === 'database_view' &&
      event.node.parentId === input.databaseId
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
      event.workspaceId === input.workspaceId &&
      event.node.type === 'database_view' &&
      event.node.parentId === input.databaseId
    ) {
      const databaseView = output.find((dv) => dv.id === event.node.id);

      if (databaseView) {
        const newResult = output.map((node) => {
          if (node.id === event.node.id) {
            return event.node as LocalDatabaseViewNode;
          }
          return node;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'database_view' &&
      event.node.parentId === input.databaseId
    ) {
      const databaseView = output.find((node) => node.id === event.node.id);

      if (databaseView) {
        const newOutput = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchDatabaseViews(
    input: DatabaseViewListQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const databaseViews = await workspace.database
      .selectFrom('nodes')
      .where('parent_id', '=', input.databaseId)
      .where('type', '=', 'database_view')
      .selectAll()
      .execute();

    return databaseViews;
  }
}
