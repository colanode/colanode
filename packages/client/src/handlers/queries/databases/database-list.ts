import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DatabaseListQueryInput } from '@colanode/client/queries/databases/database-list';
import { Event } from '@colanode/client/types/events';
import { LocalDatabaseNode } from '@colanode/client/types/nodes';
import { compareString } from '@colanode/core';

export class DatabaseListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DatabaseListQueryInput>
{
  public async handleQuery(
    input: DatabaseListQueryInput
  ): Promise<LocalDatabaseNode[]> {
    const databases = await this.fetchDatabases(input);
    const databaseNodes = databases.map(mapNode) as LocalDatabaseNode[];
    return databaseNodes.sort((a, b) => compareString(a.id, b.id));
  }

  public async checkForChanges(
    event: Event,
    input: DatabaseListQueryInput,
    output: LocalDatabaseNode[]
  ): Promise<ChangeCheckResult<DatabaseListQueryInput>> {
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
      event.node.type === 'database'
    ) {
      const newResult = await this.handleQuery(input);

      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'database'
    ) {
      const database = output.find((database) => database.id === event.node.id);
      if (database) {
        const newResult = output.map((node) => {
          if (node.id === event.node.id) {
            return event.node as LocalDatabaseNode;
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
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'database'
    ) {
      const database = output.find((node) => node.id === event.node.id);

      if (database) {
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

  private async fetchDatabases(
    input: DatabaseListQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const databases = await workspace.database
      .selectFrom('nodes')
      .where('type', '=', 'database')
      .selectAll()
      .execute();

    return databases;
  }
}
