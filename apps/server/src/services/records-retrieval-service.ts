import { sql, Kysely, Expression, SqlBool } from 'kysely';
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

import { database } from '@/data/database';
import { DatabaseSchema } from '@/data/schema';

type FilterInput = {
  filters: DatabaseViewFilterAttributes[];
  sorts: DatabaseViewSortAttributes[];
  page: number;
  count: number;
};

type SearchInput = {
  searchQuery: string;
  exclude?: string[];
};

type TextBasedFieldAttributes =
  | TextFieldAttributes
  | EmailFieldAttributes
  | PhoneFieldAttributes
  | UrlFieldAttributes;

export class RecordsRetrievalService {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async retrieveByFilters(
    databaseId: string,
    workspaceId: string,
    userId: string,
    input: FilterInput
  ) {
    const database = await this.fetchDatabase(databaseId, workspaceId);
    const filterQuery = this.buildFiltersQuery(
      input.filters,
      database.attributes.fields
    );

    const orderByQuery =
      input.sorts.length > 0
        ? this.buildSortOrdersQuery(input.sorts, database.attributes.fields)
        : 'n.id ASC';

    const offset = (input.page - 1) * input.count;

    const query = this.db
      .selectFrom('nodes as n')
      .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
      .where('n.parent_id', '=', databaseId)
      .where('n.type', '=', 'record')
      .where('n.workspace_id', '=', workspaceId)
      .where('c.collaborator_id', '=', userId)
      .where('c.deleted_at', 'is', null);

    if (filterQuery) {
      query.where(filterQuery);
    }

    const result = await query
      .orderBy(sql.raw(orderByQuery))
      .limit(input.count)
      .offset(offset)
      .selectAll()
      .execute();

    return result;
  }

  public async searchRecords(
    databaseId: string,
    workspaceId: string,
    userId: string,
    input: SearchInput
  ) {
    if (!input.searchQuery) {
      return this.fetchAllRecords(
        databaseId,
        workspaceId,
        userId,
        input.exclude
      );
    }

    const searchCondition = sql<SqlBool>`
      to_tsvector('english', n.attributes->>'name') @@ plainto_tsquery('english', ${input.searchQuery})
      OR EXISTS (
        SELECT 1
        FROM jsonb_each_text(n.attributes->'fields') fields
        WHERE to_tsvector('english', fields.value::text) @@ plainto_tsquery('english', ${input.searchQuery})
      )
    `;

    const query = this.db
      .selectFrom('nodes as n')
      .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
      .where('n.parent_id', '=', databaseId)
      .where('n.type', '=', 'record')
      .where('n.workspace_id', '=', workspaceId)
      .where('c.collaborator_id', '=', userId)
      .where('c.deleted_at', 'is', null)
      .where(searchCondition);

    if (input.exclude?.length) {
      query.where('n.id', 'not in', input.exclude);
    }

    return query.selectAll().execute();
  }

  private async fetchAllRecords(
    databaseId: string,
    workspaceId: string,
    userId: string,
    exclude?: string[]
  ) {
    return this.db
      .selectFrom('nodes as n')
      .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
      .where('n.parent_id', '=', databaseId)
      .where('n.type', '=', 'record')
      .where('n.workspace_id', '=', workspaceId)
      .where('c.collaborator_id', '=', userId)
      .where('c.deleted_at', 'is', null)
      .$if(!!exclude?.length, (qb) => qb.where('n.id', 'not in', exclude!))
      .selectAll()
      .execute();
  }

  private async fetchDatabase(
    databaseId: string,
    workspaceId: string
  ): Promise<DatabaseNode> {
    const row = await this.db
      .selectFrom('nodes')
      .where('id', '=', databaseId)
      .where('workspace_id', '=', workspaceId)
      .where('type', '=', 'database')
      .selectAll()
      .executeTakeFirst();

    if (!row) {
      throw new Error('Database not found');
    }

    return row as unknown as DatabaseNode;
  }

  private buildFiltersQuery(
    filters: DatabaseViewFilterAttributes[],
    fields: Record<string, FieldAttributes>
  ): Expression<SqlBool> | undefined {
    if (filters.length === 0) {
      return undefined;
    }

    const filterQueries = filters
      .map((filter) => this.buildFilterQuery(filter, fields))
      .filter((query): query is Expression<SqlBool> => query !== null);

    if (filterQueries.length === 0) {
      return undefined;
    }

    return sql<SqlBool>`(${sql.join(filterQueries, sql` AND `)})`;
  }

  private buildFilterQuery(
    filter: DatabaseViewFilterAttributes,
    fields: Record<string, FieldAttributes>
  ): Expression<SqlBool> | null {
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
      case 'created_at':
        return this.buildCreatedAtFilterQuery(filter, field);
      case 'date':
        return this.buildDateFilterQuery(filter, field);
      case 'email':
      case 'phone':
      case 'url':
      case 'text':
        return this.buildTextFilterQuery(
          filter,
          field as TextBasedFieldAttributes
        );
      case 'multi_select':
        return this.buildMultiSelectFilterQuery(filter, field);
      case 'number':
        return this.buildNumberFilterQuery(filter, field);
      case 'select':
        return this.buildSelectFilterQuery(filter, field);
      default:
        return null;
    }
  }

  private buildBooleanFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: BooleanFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_true') {
      return sql<SqlBool>`(n.attributes->'fields'->${field.id}->>'value')::boolean = true`;
    }

    if (filter.operator === 'is_false') {
      return sql<SqlBool>`((n.attributes->'fields'->${field.id}->>'value')::boolean = false OR n.attributes->'fields'->${field.id}->>'value' IS NULL)`;
    }

    return null;
  }

  private buildNumberFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: NumberFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NOT NULL`;
    }

    if (filter.value === null || typeof filter.value !== 'number') {
      return null;
    }

    const value = filter.value;
    let operator: string;

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

    return sql<SqlBool>`(n.attributes->'fields'->${field.id}->>'value')::numeric ${sql.raw(operator)} ${value}`;
  }

  private buildTextFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: TextBasedFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NOT NULL`;
    }

    if (filter.value === null || typeof filter.value !== 'string') {
      return null;
    }

    const value = filter.value;
    switch (filter.operator) {
      case 'is_equal_to':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' = ${value}`;
      case 'is_not_equal_to':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' != ${value}`;
      case 'contains':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' ILIKE ${'%' + value + '%'}`;
      case 'does_not_contain':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' NOT ILIKE ${'%' + value + '%'}`;
      case 'starts_with':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' ILIKE ${value + '%'}`;
      case 'ends_with':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' ILIKE ${'%' + value}`;
      default:
        return null;
    }
  }

  private buildEmailFilterQuery = this.buildTextFilterQuery;
  private buildPhoneFilterQuery = this.buildTextFilterQuery;
  private buildUrlFilterQuery = this.buildTextFilterQuery;

  private buildSelectFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: SelectFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NOT NULL`;
    }

    if (!isStringArray(filter.value) || filter.value.length === 0) {
      return null;
    }

    switch (filter.operator) {
      case 'is_in':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IN (${sql.join(filter.value)})`;
      case 'is_not_in':
        return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' NOT IN (${sql.join(filter.value)})`;
      default:
        return null;
    }
  }

  private buildMultiSelectFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: MultiSelectFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`(n.attributes->'fields'->${field.id}->>'value' IS NULL OR jsonb_array_length(n.attributes->'fields'->${field.id}->'value') = 0)`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`(n.attributes->'fields'->${field.id}->>'value' IS NOT NULL AND jsonb_array_length(n.attributes->'fields'->${field.id}->'value') > 0)`;
    }

    if (!isStringArray(filter.value) || filter.value.length === 0) {
      return null;
    }

    switch (filter.operator) {
      case 'is_in':
        return sql<SqlBool>`EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(n.attributes->'fields'->${field.id}->'value') val
          WHERE val IN (${sql.join(filter.value)})
        )`;
      case 'is_not_in':
        return sql<SqlBool>`NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(n.attributes->'fields'->${field.id}->'value') val
          WHERE val IN (${sql.join(filter.value)})
        )`;
      default:
        return null;
    }
  }

  private buildDateFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    field: DateFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`n.attributes->'fields'->${field.id}->>'value' IS NOT NULL`;
    }

    if (filter.value === null || typeof filter.value !== 'string') {
      return null;
    }

    const date = new Date(filter.value);
    if (isNaN(date.getTime())) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    let operator: string;

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

    return sql<SqlBool>`DATE(n.attributes->'fields'->${field.id}->>'value') ${sql.raw(operator)} ${dateString}`;
  }

  private buildCreatedAtFilterQuery(
    filter: DatabaseViewFieldFilterAttributes,
    _: CreatedAtFieldAttributes
  ): Expression<SqlBool> | null {
    if (filter.operator === 'is_empty') {
      return sql<SqlBool>`n.created_at IS NULL`;
    }

    if (filter.operator === 'is_not_empty') {
      return sql<SqlBool>`n.created_at IS NOT NULL`;
    }

    if (filter.value === null || typeof filter.value !== 'string') {
      return null;
    }

    const date = new Date(filter.value);
    if (isNaN(date.getTime())) {
      return null;
    }

    const dateString = date.toISOString().split('T')[0];
    let operator: string;

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

    return sql<SqlBool>`DATE(n.created_at) ${sql.raw(operator)} ${dateString}`;
  }

  private buildSortOrdersQuery(
    sorts: DatabaseViewSortAttributes[],
    fields: Record<string, FieldAttributes>
  ): string {
    return sorts
      .map((sort) => this.buildSortOrderQuery(sort, fields))
      .filter((query): query is string => query !== null)
      .join(', ');
  }

  private buildSortOrderQuery(
    sort: DatabaseViewSortAttributes,
    fields: Record<string, FieldAttributes>
  ): string | null {
    const field = fields[sort.fieldId];
    if (!field) {
      return null;
    }

    if (field.type === 'created_at') {
      return `n.created_at ${sort.direction}`;
    }

    if (field.type === 'created_by') {
      return `n.created_by ${sort.direction}`;
    }

    return `n.attributes->'fields'->${sort.fieldId}->>'value' ${sort.direction}`;
  }
}

export const recordsRetrievalService = new RecordsRetrievalService(database);
