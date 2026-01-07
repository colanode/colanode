import { ParsedOrderBy, SimpleComparison } from '@tanstack/db';

import { LocalNode } from '@colanode/client/types/nodes';

export const isNodeSynced = (node: LocalNode): boolean => {
  if (typeof node.serverRevision === 'string') {
    return node.serverRevision !== '0';
  }

  if (typeof node.serverRevision === 'number') {
    return node.serverRevision > 0;
  }

  return false;
};

type SqliteOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IS'
  | 'IS NOT'
  | 'IN'
  | 'NOT IN';

// Map of node fields to their database column names
const NODE_COLUMN_FIELDS: Record<string, string> = {
  id: 'id',
  type: 'type',
  parentId: 'parent_id',
  rootId: 'root_id',
  createdAt: 'created_at',
  createdBy: 'created_by',
  updatedAt: 'updated_at',
  updatedBy: 'updated_by',
  localRevision: 'local_revision',
  serverRevision: 'server_revision',
};

const escapeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (Array.isArray(value)) {
    return `(${value.map(escapeValue).join(', ')})`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
};

const fieldPathToString = (field: Array<string | number>): string => {
  return field.join('.');
};

const isColumnField = (fieldPath: string): boolean => {
  return fieldPath in NODE_COLUMN_FIELDS;
};

const getColumnName = (fieldPath: string): string => {
  return NODE_COLUMN_FIELDS[fieldPath] ?? fieldPath;
};

const buildColumnFilter = (
  column: string,
  operator: SqliteOperator,
  value: string
): string => {
  return `n.${column} ${operator} ${value}`;
};

const buildJsonFilter = (
  jsonPath: string,
  operator: SqliteOperator,
  value: string
): string => {
  return `json_extract(n.attributes, '$.${jsonPath}') ${operator} ${value}`;
};

const operatorToSqlite = (operator: string): SqliteOperator | null => {
  switch (operator) {
    case 'eq':
      return '=';
    case 'not_eq':
      return '!=';
    case 'gt':
      return '>';
    case 'gte':
      return '>=';
    case 'lt':
      return '<';
    case 'lte':
      return '<=';
    case 'like':
    case 'ilike':
      return 'LIKE';
    case 'in':
    case 'inArray':
      return 'IN';
    default:
      return null;
  }
};

const buildSingleFilter = (filter: SimpleComparison): string | null => {
  const fieldPath = fieldPathToString(filter.field);

  // Handle null checks
  if (filter.operator === 'isNull') {
    if (isColumnField(fieldPath)) {
      return buildColumnFilter(getColumnName(fieldPath), 'IS', 'NULL');
    }
    return buildJsonFilter(fieldPath, 'IS', 'NULL');
  }

  if (filter.operator === 'isUndefined') {
    if (isColumnField(fieldPath)) {
      return buildColumnFilter(getColumnName(fieldPath), 'IS', 'NULL');
    }
    return buildJsonFilter(fieldPath, 'IS', 'NULL');
  }

  if (filter.operator === 'not_isNull') {
    if (isColumnField(fieldPath)) {
      return buildColumnFilter(getColumnName(fieldPath), 'IS NOT', 'NULL');
    }
    return buildJsonFilter(fieldPath, 'IS NOT', 'NULL');
  }

  const sqliteOp = operatorToSqlite(filter.operator);
  if (!sqliteOp) {
    return null;
  }

  const escapedValue = escapeValue(filter.value);

  if (isColumnField(fieldPath)) {
    return buildColumnFilter(getColumnName(fieldPath), sqliteOp, escapedValue);
  }

  return buildJsonFilter(fieldPath, sqliteOp, escapedValue);
};

export const buildNodeFiltersQuery = (
  filters: Array<SimpleComparison>
): string => {
  if (filters.length === 0) {
    return '';
  }

  const filterQueries = filters
    .map(buildSingleFilter)
    .filter((query): query is string => query !== null);

  if (filterQueries.length === 0) {
    return '';
  }

  return `AND (${filterQueries.join(' AND ')})`;
};

const buildSingleSort = (sort: ParsedOrderBy): string | null => {
  const fieldPath = fieldPathToString(sort.field);
  const direction = sort.direction.toUpperCase();
  const nullsOrder = sort.nulls === 'first' ? 'NULLS FIRST' : 'NULLS LAST';

  if (isColumnField(fieldPath)) {
    return `n.${getColumnName(fieldPath)} ${direction} ${nullsOrder}`;
  }

  return `json_extract(n.attributes, '$.${fieldPath}') ${direction} ${nullsOrder}`;
};

export const buildNodeSortsQuery = (sorts: Array<ParsedOrderBy>): string => {
  if (sorts.length === 0) {
    return '';
  }

  const sortQueries = sorts
    .map(buildSingleSort)
    .filter((query): query is string => query !== null);

  if (sortQueries.length === 0) {
    return '';
  }

  return sortQueries.join(', ');
};
