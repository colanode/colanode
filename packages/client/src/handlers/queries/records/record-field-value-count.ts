import { sql } from 'kysely';

import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import { buildFiltersQuery } from '@colanode/client/lib/records';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  RecordFieldValueCountQueryInput,
  RecordFieldValueCountQueryOutput,
  RecordFieldValueCount,
} from '@colanode/client/queries/records/record-field-value-count';
import { Event } from '@colanode/client/types/events';
import { DatabaseNode, FieldAttributes } from '@colanode/core';

export class RecordFieldValueCountQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<RecordFieldValueCountQueryInput>
{
  public async handleQuery(
    input: RecordFieldValueCountQueryInput
  ): Promise<RecordFieldValueCountQueryOutput> {
    const counts = await this.fetchFieldValueCounts(input);
    return {
      items: counts,
    };
  }

  public async checkForChanges(
    event: Event,
    input: RecordFieldValueCountQueryInput,
    _output: RecordFieldValueCountQueryOutput
  ): Promise<ChangeCheckResult<RecordFieldValueCountQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: { items: [] },
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
          result: { items: [] },
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFieldValueCounts(
    input: RecordFieldValueCountQueryInput
  ): Promise<RecordFieldValueCount[]> {
    const database = await this.fetchDatabase(input);
    const field = database.attributes.fields[input.fieldId];

    if (!field) {
      return [];
    }

    const filterQuery = buildFiltersQuery(
      input.filters,
      database.attributes.fields
    );

    const queryString = this.buildQuery(input.databaseId, field, filterQuery);

    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const query = sql<RecordFieldValueCount>`${sql.raw(queryString)}`.compile(
      workspace.database
    );

    const result = await workspace.database.executeQuery(query);
    return result.rows;
  }

  private buildQuery(
    databaseId: string,
    field: FieldAttributes,
    filterQuery: string
  ): string {
    switch (field.type) {
      case 'boolean':
        return this.buildBooleanQuery(databaseId, field, filterQuery);
      case 'multi_select':
      case 'collaborator':
      case 'relation':
        return this.buildStringArrayQuery(databaseId, field, filterQuery);
      default:
        return this.buildDefaultQuery(databaseId, field, filterQuery);
    }
  }

  private buildBooleanQuery(
    databaseId: string,
    field: FieldAttributes,
    filterQuery: string
  ): string {
    return `
      SELECT 
        CASE
          WHEN ${this.buildFieldSelector(field)} = 'true' THEN 'true'
          ELSE 'false'
        END as value,
        COUNT(*) as count
      FROM nodes n
      WHERE n.parent_id = '${databaseId}' 
        AND n.type = 'record' 
        ${filterQuery}
      GROUP BY value
      ORDER BY count DESC, value ASC
    `;
  }

  private buildStringArrayQuery(
    databaseId: string,
    field: FieldAttributes,
    filterQuery: string
  ): string {
    return `
      SELECT 
        json_each.value as value,
        COUNT(*) as count
      FROM nodes n,
      json_each(${this.buildFieldSelector(field)})
      WHERE n.parent_id = '${databaseId}' 
        AND n.type = 'record' 
        AND ${this.buildFieldSelector(field)} IS NOT NULL
        ${filterQuery}
      GROUP BY json_each.value
      ORDER BY count DESC, value ASC
    `;
  }

  private buildDefaultQuery(
    databaseId: string,
    field: FieldAttributes,
    filterQuery: string
  ): string {
    return `
      SELECT 
        COALESCE(CAST(${this.buildFieldSelector(field)} AS TEXT), 'null') as value,
        COUNT(*) as count
      FROM nodes n
      WHERE n.parent_id = '${databaseId}' 
        AND n.type = 'record'
        AND ${this.buildFieldSelector(field)} IS NOT NULL
        ${filterQuery}
      GROUP BY value
      ORDER BY count DESC, value ASC
    `;
  }

  private buildFieldSelector(field: FieldAttributes): string {
    if (field.type === 'created_at') {
      return `n.created_at`;
    }

    if (field.type === 'created_by') {
      return `n.created_by`;
    }

    if (field.type === 'updated_at') {
      return `n.updated_at`;
    }

    if (field.type === 'updated_by') {
      return `n.updated_by`;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value')`;
  }

  private async fetchDatabase(
    input: RecordFieldValueCountQueryInput
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
