import { sql } from 'kysely';

import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import {
  buildFiltersQuery,
  buildSortOrdersQuery,
} from '@colanode/client/lib/records';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { RecordListQueryInput } from '@colanode/client/queries/records/record-list';
import { Event } from '@colanode/client/types/events';
import { LocalRecordNode } from '@colanode/client/types/nodes';
import { DatabaseNode } from '@colanode/core';

export class RecordListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<RecordListQueryInput>
{
  public async handleQuery(
    input: RecordListQueryInput
  ): Promise<LocalRecordNode[]> {
    const rows = await this.fetchRecords(input);
    return rows.map(mapNode) as LocalRecordNode[];
  }

  public async checkForChanges(
    event: Event,
    input: RecordListQueryInput,
    output: LocalRecordNode[]
  ): Promise<ChangeCheckResult<RecordListQueryInput>> {
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
      event.node.type === 'record'
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
      event.workspaceId === input.workspaceId
    ) {
      if (
        event.node.type === 'record' &&
        event.node.attributes.databaseId === input.databaseId
      ) {
        if (input.filters.length > 0 || input.sorts.length > 0) {
          const newResult = await this.handleQuery(input);
          return {
            hasChanges: true,
            result: newResult,
          };
        }

        const record = output.find((record) => record.id === event.node.id);
        if (record) {
          const newResult = output.map((record) => {
            if (record.id === event.node.id) {
              return event.node as LocalRecordNode;
            }
            return record;
          });

          return {
            hasChanges: true,
            result: newResult,
          };
        }
      }

      if (
        event.node.type === 'database' &&
        event.node.id === input.databaseId
      ) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      if (
        event.node.type === 'record' &&
        event.node.attributes.databaseId === input.databaseId
      ) {
        const newResult = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }

      if (
        event.node.type === 'database' &&
        event.node.id === input.databaseId
      ) {
        return {
          hasChanges: true,
          result: [],
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchRecords(
    input: RecordListQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const database = await this.fetchDatabase(input);
    const filterQuery = buildFiltersQuery(
      input.filters,
      database.attributes.fields,
      workspace.userId
    );

    const orderByQuery = `ORDER BY ${input.sorts.length > 0 ? buildSortOrdersQuery(input.sorts, database.attributes.fields) : 'n."id" ASC'}`;
    const offset = (input.page - 1) * input.count;
    const query = sql<SelectNode>`
        SELECT n.*
        FROM nodes n
        WHERE n.parent_id = ${input.databaseId} AND n.type = 'record' ${sql.raw(filterQuery)}
        ${sql.raw(orderByQuery)}
        LIMIT ${sql.lit(input.count)}
        OFFSET ${sql.lit(offset)}
    `.compile(workspace.database);

    const result = await workspace.database.executeQuery(query);
    return result.rows;
  }

  private async fetchDatabase(
    input: RecordListQueryInput
  ): Promise<DatabaseNode> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const row = await workspace.database
      .selectFrom('nodes')
      .where('id', '=', input.databaseId)
      .selectAll()
      .executeTakeFirst();

    if (!row) {
      throw new Error('Database not found');
    }

    const database = mapNode(row) as DatabaseNode;
    return database;
  }
}
