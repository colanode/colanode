import {
  BooleanFieldAttributes,
  CreatedAtFieldAttributes,
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
  SpecialId,
  FieldValueType,
  CollaboratorFieldAttributes,
  CreatedByFieldAttributes,
} from '@colanode/core';

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

export const buildFiltersQuery = (
  filters: DatabaseViewFilterAttributes[],
  fields: Record<string, FieldAttributes>
): string => {
  if (filters.length === 0) {
    return '';
  }

  const filterQueries = filters
    .map((filter) => buildFilterQuery(filter, fields))
    .filter((query) => query !== null);

  if (filterQueries.length === 0) {
    return '';
  }

  return `AND (${filterQueries.join(' AND ')})`;
};

const buildFilterQuery = (
  filter: DatabaseViewFilterAttributes,
  fields: Record<string, FieldAttributes>
): string | null => {
  if (filter.type === 'group') {
    return null;
  }

  if (filter.fieldId === SpecialId.Name) {
    return buildNameFilterQuery(filter);
  }

  const field = fields[filter.fieldId];
  if (!field) {
    return null;
  }

  switch (field.type) {
    case 'boolean':
      return buildBooleanFilterQuery(filter, field);
    case 'collaborator':
      return buildCollaboratorFilterQuery(filter, field);
    case 'created_at':
      return buildCreatedAtFilterQuery(filter, field);
    case 'created_by':
      return buildCreatedByFilterQuery(filter, field);
    case 'date':
      return buildDateFilterQuery(filter, field);
    case 'email':
      return buildEmailFilterQuery(filter, field);
    case 'file':
      return null;
    case 'multi_select':
      return buildMultiSelectFilterQuery(filter, field);
    case 'number':
      return buildNumberFilterQuery(filter, field);
    case 'phone':
      return buildPhoneFilterQuery(filter, field);
    case 'select':
      return buildSelectFilterQuery(filter, field);
    case 'text':
      return buildTextFilterQuery(filter, field);
    case 'url':
      return buildUrlFilterQuery(filter, field);
    default:
      return null;
  }
};

const buildNameFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildAttributeFilterQuery('name', 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildAttributeFilterQuery('name', 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  if (!value || value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildAttributeFilterQuery('name', '=', `'${value}'`);
    case 'is_not_equal_to':
      return buildAttributeFilterQuery('name', '!=', `'${value}'`);
    case 'contains':
      return buildAttributeFilterQuery('name', 'LIKE', `'%${value}%'`);
    case 'does_not_contain':
      return buildAttributeFilterQuery('name', 'NOT LIKE', `'%${value}%'`);
    case 'starts_with':
      return buildAttributeFilterQuery('name', 'LIKE', `'${value}%'`);
    case 'ends_with':
      return buildAttributeFilterQuery('name', 'LIKE', `'%${value}'`);
    default:
      return null;
  }
};

const buildBooleanFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: BooleanFieldAttributes
): string | null => {
  if (filter.operator === 'is_true') {
    return buildFieldFilterQuery(field.id, '=', 'true');
  }

  if (filter.operator === 'is_false') {
    return `(${buildFieldFilterQuery(field.id, '=', 'false')} OR ${buildFieldFilterQuery(field.id, 'IS', 'NULL')})`;
  }

  return null;
};

const buildCollaboratorFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: CollaboratorFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildArrayIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildArrayIsNotEmptyFilterQuery(field.id);
  }

  if (!isStringArray(filter.value)) {
    return null;
  }

  if (filter.value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_in':
      return buildArrayContainsFilterQuery(field.id, filter.value);
    case 'is_not_in':
      return buildArrayDoesNotContainFilterQuery(field.id, filter.value);
    default:
      return null;
  }
};

const buildNumberFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: NumberFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'number') {
    return null;
  }

  const value = filter.value as number;
  if (isNaN(value)) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', value.toString());
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', value.toString());
    case 'is_greater_than':
      return buildFieldFilterQuery(field.id, '>', value.toString());
    case 'is_less_than':
      return buildFieldFilterQuery(field.id, '<', value.toString());
    case 'is_greater_than_or_equal_to':
      return buildFieldFilterQuery(field.id, '>=', value.toString());
    case 'is_less_than_or_equal_to':
      return buildFieldFilterQuery(field.id, '<=', value.toString());
    default:
      return null;
  }
};

const buildTextFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: TextFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  if (!value || value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', `'${value}'`);
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', `'${value}'`);
    case 'contains':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}%'`);
    case 'does_not_contain':
      return buildFieldFilterQuery(field.id, 'NOT LIKE', `'%${value}%'`);
    case 'starts_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'${value}%'`);
    case 'ends_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}'`);
    default:
      return null;
  }
};

const buildEmailFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: EmailFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  if (!value || value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', `'${value}'`);
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', `'${value}'`);
    case 'contains':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}%'`);
    case 'does_not_contain':
      return buildFieldFilterQuery(field.id, 'NOT LIKE', `'%${value}%'`);
    case 'starts_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'${value}%'`);
    case 'ends_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}'`);
    default:
      return null;
  }
};

const buildPhoneFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: PhoneFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  if (!value || value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', `'${value}'`);
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', `'${value}'`);
    case 'contains':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}%'`);
    case 'does_not_contain':
      return buildFieldFilterQuery(field.id, 'NOT LIKE', `'%${value}%'`);
    case 'starts_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'${value}%'`);
    case 'ends_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}'`);
    default:
      return null;
  }
};

const buildUrlFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: UrlFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (filter.value === null) {
    return null;
  }

  if (typeof filter.value !== 'string') {
    return null;
  }

  const value = filter.value as string;
  if (!value || value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', `'${value}'`);
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', `'${value}'`);
    case 'contains':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}%'`);
    case 'does_not_contain':
      return buildFieldFilterQuery(field.id, 'NOT LIKE', `'%${value}%'`);
    case 'starts_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'${value}%'`);
    case 'ends_with':
      return buildFieldFilterQuery(field.id, 'LIKE', `'%${value}'`);
    default:
      return null;
  }
};

const buildSelectFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: SelectFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
  }

  if (!isStringArray(filter.value)) {
    return null;
  }

  if (filter.value.length === 0) {
    return null;
  }

  const values = joinIds(filter.value);
  switch (filter.operator) {
    case 'is_in':
      return buildFieldFilterQuery(field.id, 'IN', `(${values})`);
    case 'is_not_in':
      return buildFieldFilterQuery(field.id, 'NOT IN', `(${values})`);
    default:
      return null;
  }
};

const buildMultiSelectFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: MultiSelectFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildArrayIsEmptyFilterQuery(field.id);
  }

  if (filter.operator === 'is_not_empty') {
    return buildArrayIsNotEmptyFilterQuery(field.id);
  }

  if (!isStringArray(filter.value)) {
    return null;
  }

  if (filter.value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_in':
      return buildArrayContainsFilterQuery(field.id, filter.value);
    case 'is_not_in':
      return buildArrayDoesNotContainFilterQuery(field.id, filter.value);
    default:
      return null;
  }
};

const buildDateFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: DateFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildFieldFilterQuery(field.id, 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildFieldFilterQuery(field.id, 'IS NOT', 'NULL');
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

  switch (filter.operator) {
    case 'is_equal_to':
      return buildFieldFilterQuery(field.id, '=', `'${dateString}'`);
    case 'is_not_equal_to':
      return buildFieldFilterQuery(field.id, '!=', `'${dateString}'`);
    case 'is_on_or_after':
      return buildFieldFilterQuery(field.id, '>=', `'${dateString}'`);
    case 'is_on_or_before':
      return buildFieldFilterQuery(field.id, '<=', `'${dateString}'`);
    case 'is_after':
      return buildFieldFilterQuery(field.id, '>', `'${dateString}'`);
    case 'is_before':
      return buildFieldFilterQuery(field.id, '<', `'${dateString}'`);
    default:
      return null;
  }
};

const buildCreatedAtFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  _: CreatedAtFieldAttributes
): string | null => {
  if (filter.operator === 'is_empty') {
    return buildAttributeFilterQuery('created_at', 'IS', 'NULL');
  }

  if (filter.operator === 'is_not_empty') {
    return buildAttributeFilterQuery('created_at', 'IS NOT', 'NULL');
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

  switch (filter.operator) {
    case 'is_equal_to':
      return buildAttributeFilterQuery('created_at', '=', `'${dateString}'`);
    case 'is_not_equal_to':
      return buildAttributeFilterQuery('created_at', '!=', `'${dateString}'`);
    case 'is_on_or_after':
      return buildAttributeFilterQuery('created_at', '>=', `'${dateString}'`);
    case 'is_on_or_before':
      return buildAttributeFilterQuery('created_at', '<=', `'${dateString}'`);
    case 'is_after':
      return buildAttributeFilterQuery('created_at', '>', `'${dateString}'`);
    case 'is_before':
      return buildAttributeFilterQuery('created_at', '<', `'${dateString}'`);
    default:
      return null;
  }
};

const buildCreatedByFilterQuery = (
  filter: DatabaseViewFieldFilterAttributes,
  field: CreatedByFieldAttributes
): string | null => {
  if (!isStringArray(filter.value)) {
    return null;
  }

  if (filter.value.length === 0) {
    return null;
  }

  switch (filter.operator) {
    case 'is_in':
      return buildArrayContainsFilterQuery(field.id, filter.value);
    case 'is_not_in':
      return buildArrayDoesNotContainFilterQuery(field.id, filter.value);
    default:
      return null;
  }
};

const buildFieldFilterQuery = (
  fieldId: string,
  operator: SqliteOperator,
  value: string
): string => {
  return buildAttributeFilterQuery(`fields.${fieldId}.value`, operator, value);
};

const buildAttributeFilterQuery = (
  name: string,
  operator: SqliteOperator,
  value: string
): string => {
  return `json_extract(n.attributes, '$.${name}') ${operator} ${value}`;
};

const buildArrayIsEmptyFilterQuery = (fieldId: string): string => {
  return `json_extract(n.attributes, '$.fields.${fieldId}.value') IS NULL OR json_array_length(json_extract(n.attributes, '$.fields.${fieldId}.value')) = 0`;
};

const buildArrayIsNotEmptyFilterQuery = (fieldId: string): string => {
  return `json_extract(n.attributes, '$.fields.${fieldId}.value') IS NOT NULL AND json_array_length(json_extract(n.attributes, '$.fields.${fieldId}.value')) > 0`;
};

const buildArrayContainsFilterQuery = (
  fieldId: string,
  value: string[]
): string => {
  const ids = joinIds(value);
  return `EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.fields.${fieldId}.value')) WHERE json_each.value IN (${ids}))`;
};

const buildArrayDoesNotContainFilterQuery = (
  fieldId: string,
  value: string[]
): string => {
  const ids = joinIds(value);
  return `NOT EXISTS (SELECT 1 FROM json_each(json_extract(n.attributes, '$.fields.${fieldId}.value')) WHERE json_each.value IN (${ids}))`;
};

const joinIds = (ids: string[]): string => {
  return ids.map((id) => `'${id}'`).join(',');
};

export const buildSortOrdersQuery = (
  sorts: DatabaseViewSortAttributes[],
  fields: Record<string, FieldAttributes>
): string => {
  return sorts
    .map((sort) => buildSortOrderQuery(sort, fields))
    .filter((query) => query !== null && query.length > 0)
    .join(', ');
};

const buildSortOrderQuery = (
  sort: DatabaseViewSortAttributes,
  fields: Record<string, FieldAttributes>
): string | null => {
  if (sort.fieldId === SpecialId.Name) {
    return `json_extract(n.attributes, '$.name') ${sort.direction}`;
  }

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

export const getValueTypeForField = (
  field: FieldAttributes
): FieldValueType => {
  if (field.type === 'boolean') {
    return 'boolean';
  }

  if (
    field.type === 'collaborator' ||
    field.type === 'relation' ||
    field.type === 'multi_select'
  ) {
    return 'string_array';
  }

  if (field.type === 'number') {
    return 'number';
  }

  return 'text';
};
