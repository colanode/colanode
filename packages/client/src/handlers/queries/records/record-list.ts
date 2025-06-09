import { sql } from 'kysely';

import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { RecordListQueryInput } from '@colanode/client/queries/records/record-list';
import { Event } from '@colanode/client/types/events';
import { LocalRecordNode } from '@colanode/client/types/nodes';
import {
  BooleanFieldAttributes,
  CreatedAtFieldAttributes,
  DatabaseNode,
  DateFieldAttributes,
  EmailFieldAttributes,
  FieldAttributes,
  isStringArray,
  NumberFieldAttributes,
  PhoneFieldAttributes,
  SelectFieldAttributes,
  TextFieldAttributes,
  UrlFieldAttributes,
  DatabaseViewFieldFilterAttributes,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  MultiSelectFieldAttributes,
} from '@colanode/core';

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
    const database = await this.fetchDatabase(input);
    const filterQuery = this.buildFiltersQuery(
      input.filters,
      database.attributes.fields
    );

    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const orderByQuery = `ORDER BY ${input.sorts.length > 0 ? this.buildSortOrdersQuery(input.sorts, database.attributes.fields) : 'n."id" ASC'}`;
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

  private buildFiltersQuery = (
    filters: DatabaseViewFilterAttributes[],
    fields: Record<string, FieldAttributes>
  ): string => {
    if (filters.length === 0) {
      return '';
    }

    const filterQueries = filters
      .map((filter) => this.buildFilterQuery(filter, fields))
      .filter((query) => query !== null);

    if (filterQueries.length === 0) {
      return '';
    }

    return `AND (${filterQueries.join(' AND ')})`;
  };

  private buildFilterQuery = (
    filter: DatabaseViewFilterAttributes,
    fields: Record<string, FieldAttributes>
  ): string | null => {
    if (filter.type === 'group') {
      return null;
    }

    const field = fields[filter.fieldId];
    if (!field) {
      return null;
    }

    switch (field.type) {
      case 'boolean':
        return this.buildBooleanFilterQuery(filter, field);
      case 'collaborator':
        return null;
      case 'created_at':
        return this.buildCreatedAtFilterQuery(filter, field);
      case 'created_by':
        return null;
      case 'date':
        return this.buildDateFilterQuery(filter, field);
      case 'email':
        return this.buildEmailFilterQuery(filter, field);
      case 'file':
        return null;
      case 'multi_select':
        return this.buildMultiSelectFilterQuery(filter, field);
      case 'number':
        return this.buildNumberFilterQuery(filter, field);
      case 'phone':
        return this.buildPhoneFilterQuery(filter, field);
      case 'select':
        return this.buildSelectFilterQuery(filter, field);
      case 'text':
        return this.buildTextFilterQuery(filter, field);
      case 'url':
        return this.buildUrlFilterQuery(filter, field);
      default:
        return null;
    }
  };

  private buildBooleanFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: BooleanFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_true') {
      return `json_extract(n.attributes, '$.fields.${field.id}.value') = true`;
    }

    if (filter.operator === 'is_false') {
      return `(json_extract(n.attributes, '$.fields.${field.id}.value') = false OR json_extract(n.attributes, '$.fields.${field.id}.value') IS NULL)`;
    }

    return null;
  };

  private buildNumberFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: NumberFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'number') {
      return null;
    }

    const value = filter.value as number;
    let operator: string | null;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'is_greater_than':
        operator = '>';
        break;
      case 'is_less_than':
        operator = '<';
        break;
      case 'is_greater_than_or_equal_to':
        operator = '>=';
        break;
      case 'is_less_than_or_equal_to':
        operator = '<=';
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${operator} ${value}`;
  };

  private buildTextFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: TextFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const value = filter.value as string;
    let operator: string | null;
    let formattedValue = value;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'contains':
        operator = 'LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'does_not_contain':
        operator = 'NOT LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'starts_with':
        operator = 'LIKE';
        formattedValue = `${value}%`;
        break;
      case 'ends_with':
        operator = 'LIKE';
        formattedValue = `%${value}`;
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${operator} '${formattedValue}'`;
  };

  private buildEmailFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: EmailFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const value = filter.value as string;
    let operator: string | null;
    let formattedValue = value;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'contains':
        operator = 'LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'does_not_contain':
        operator = 'NOT LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'starts_with':
        operator = 'LIKE';
        formattedValue = `${value}%`;
        break;
      case 'ends_with':
        operator = 'LIKE';
        formattedValue = `%${value}`;
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${operator} '${formattedValue}'`;
  };

  private buildPhoneFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: PhoneFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const value = filter.value as string;
    let operator: string | null;
    let formattedValue = value;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'contains':
        operator = 'LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'does_not_contain':
        operator = 'NOT LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'starts_with':
        operator = 'LIKE';
        formattedValue = `${value}%`;
        break;
      case 'ends_with':
        operator = 'LIKE';
        formattedValue = `%${value}`;
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${operator} '${formattedValue}'`;
  };

  private buildUrlFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: UrlFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const value = filter.value as string;
    let operator: string | null;
    let formattedValue = value;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'contains':
        operator = 'LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'does_not_contain':
        operator = 'NOT LIKE';
        formattedValue = `%${value}%`;
        break;
      case 'starts_with':
        operator = 'LIKE';
        formattedValue = `${value}%`;
        break;
      case 'ends_with':
        operator = 'LIKE';
        formattedValue = `%${value}`;
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${operator} '${formattedValue}'`;
  };

  private buildSelectFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: SelectFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (!isStringArray(filter.value)) {
      return null;
    }

    if (filter.value.length === 0) {
      return null;
    }

    const values = this.joinIds(filter.value);
    switch (filter.operator) {
      case 'is_in':
        return `json_extract(n.attributes, '$.fields.${field.id}.value') IN (${values})`;
      case 'is_not_in':
        return `json_extract(n.attributes, '$.fields.${field.id}.value') NOT IN (${values})`;
      default:
        return null;
    }
  };

  private buildMultiSelectFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: MultiSelectFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return `json_extract(n.attributes, '$.fields.${field.id}.value') IS NULL OR json_array_length(json_extract(n.attributes, '$.fields.${field.id}.value')) = 0`;
    }

    if (filter.operator === 'is_not_empty') {
      return `json_extract(n.attributes, '$.fields.${field.id}.value') IS NOT NULL AND json_array_length(json_extract(n.attributes, '$.fields.${field.id}.value')) > 0`;
    }

    if (!isStringArray(filter.value)) {
      return null;
    }

    if (filter.value.length === 0) {
      return null;
    }

    const values = this.joinIds(filter.value);
    switch (filter.operator) {
      case 'is_in':
        return `EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.fields.${field.id}.value')) WHERE json_each.value IN (${values}))`;
      case 'is_not_in':
        return `NOT EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.fields.${field.id}.value')) WHERE json_each.value IN (${values}))`;
      default:
        return null;
    }
  };

  private buildDateFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    field: DateFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return this.buildIsEmptyFilterQuery(field.id);
    }

    if (filter.operator === 'is_not_empty') {
      return this.buildIsNotEmptyFilterQuery(field.id);
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const date = new Date(filter.value);
    if (isNaN(date.getTime())) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    let operator: string | null;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'is_on_or_after':
        operator = '>=';
        break;
      case 'is_on_or_before':
        operator = '<=';
        break;
      case 'is_after':
        operator = '>';
        break;
      case 'is_before':
        operator = '<';
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `DATE(json_extract(n.attributes, '$.fields.${field.id}.value')) ${operator} '${dateString}'`;
  };

  private buildCreatedAtFilterQuery = (
    filter: DatabaseViewFieldFilterAttributes,
    _: CreatedAtFieldAttributes
  ): string | null => {
    if (filter.operator === 'is_empty') {
      return `n.created_at IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return `n.created_at IS NOT NULL`;
    }

    if (filter.value === null) {
      return null;
    }

    if (typeof filter.value !== 'string') {
      return null;
    }

    const date = new Date(filter.value);
    if (isNaN(date.getTime())) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    let operator: string | null;

    switch (filter.operator) {
      case 'is_equal_to':
        operator = '=';
        break;
      case 'is_not_equal_to':
        operator = '!=';
        break;
      case 'is_on_or_after':
        operator = '>=';
        break;
      case 'is_on_or_before':
        operator = '<=';
        break;
      case 'is_after':
        operator = '>';
        break;
      case 'is_before':
        operator = '<';
        break;
      default:
        return null;
    }

    if (operator === null) {
      return null;
    }

    return `DATE(n.created_at) ${operator} '${dateString}'`;
  };

  private buildIsEmptyFilterQuery = (fieldId: string): string => {
    return `json_extract(n.attributes, '$.fields.${fieldId}.value') IS NULL`;
  };

  private buildIsNotEmptyFilterQuery = (fieldId: string): string => {
    return `json_extract(n.attributes, '$.fields.${fieldId}.value') IS NOT NULL`;
  };

  private joinIds = (ids: string[]): string => {
    return ids.map((id) => `'${id}'`).join(',');
  };

  private buildSortOrdersQuery = (
    sorts: DatabaseViewSortAttributes[],
    fields: Record<string, FieldAttributes>
  ): string => {
    return sorts
      .map((sort) => this.buildSortOrderQuery(sort, fields))
      .filter((query) => query !== null && query.length > 0)
      .join(', ');
  };

  private buildSortOrderQuery = (
    sort: DatabaseViewSortAttributes,
    fields: Record<string, FieldAttributes>
  ): string | null => {
    const field = fields[sort.fieldId];
    if (!field) {
      return null;
    }

    if (field.type === 'created_at') {
      return `n.created_at ${sort.direction}`;
    }

    if (field.type === 'created_by') {
      return `n.created_by_id ${sort.direction}`;
    }

    return `json_extract(n.attributes, '$.fields.${field.id}.value') ${sort.direction}`;
  };
}
