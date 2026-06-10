import {
  DatabaseViewFieldFilterAttributes,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  FieldAttributes,
  FieldValue,
  SpecialId,
  isStringArray,
} from '@colanode/core';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

const isMissing = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

const normalizeDate = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0] ?? null;
};

const getRowValue = (
  row: CollectionRow,
  fieldId: string,
  fieldsById: Record<string, FieldAttributes>
): unknown => {
  if (fieldId === SpecialId.Name) {
    return row.name;
  }

  const field = fieldsById[fieldId];
  if (!field) {
    return undefined;
  }

  switch (field.type) {
    case 'created_at':
      return row.createdAt;
    case 'created_by':
      return row.createdBy;
    case 'updated_at':
      return row.updatedAt;
    case 'updated_by':
      return row.updatedBy;
    default:
      return row.fields[field.id]?.value;
  }
};

const matchStringFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes
): boolean => {
  const text = typeof value === 'string' ? value : '';

  switch (filter.operator) {
    case 'is_empty':
      return isMissing(value) || text.length === 0;
    case 'is_not_empty':
      return !isMissing(value) && text.length > 0;
    case 'is_equal_to':
      return typeof filter.value === 'string' && text === filter.value;
    case 'is_not_equal_to':
      return typeof filter.value === 'string' && text !== filter.value;
    case 'contains':
      return (
        typeof filter.value === 'string' &&
        text.toLowerCase().includes(filter.value.toLowerCase())
      );
    case 'does_not_contain':
      return (
        typeof filter.value === 'string' &&
        !text.toLowerCase().includes(filter.value.toLowerCase())
      );
    case 'starts_with':
      return (
        typeof filter.value === 'string' &&
        text.toLowerCase().startsWith(filter.value.toLowerCase())
      );
    case 'ends_with':
      return (
        typeof filter.value === 'string' &&
        text.toLowerCase().endsWith(filter.value.toLowerCase())
      );
    default:
      return true;
  }
};

const matchBooleanFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes
): boolean => {
  switch (filter.operator) {
    case 'is_true':
      return value === true;
    case 'is_false':
      return value === false || isMissing(value);
    default:
      return true;
  }
};

const matchNumberFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes
): boolean => {
  if (filter.operator === 'is_empty') {
    return isMissing(value);
  }

  if (filter.operator === 'is_not_empty') {
    return !isMissing(value);
  }

  if (typeof filter.value !== 'number' || typeof value !== 'number') {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return value === filter.value;
    case 'is_not_equal_to':
      return value !== filter.value;
    case 'is_greater_than':
      return value > filter.value;
    case 'is_less_than':
      return value < filter.value;
    case 'is_greater_than_or_equal_to':
      return value >= filter.value;
    case 'is_less_than_or_equal_to':
      return value <= filter.value;
    default:
      return true;
  }
};

const matchDateFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes,
  allowEmpty: boolean
): boolean => {
  if (allowEmpty) {
    if (filter.operator === 'is_empty') {
      return isMissing(value);
    }

    if (filter.operator === 'is_not_empty') {
      return !isMissing(value);
    }
  }

  const rowDate = normalizeDate(value);
  const filterDate = normalizeDate(filter.value);

  if (!rowDate || !filterDate) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return rowDate === filterDate;
    case 'is_not_equal_to':
      return rowDate !== filterDate;
    case 'is_on_or_after':
      return rowDate >= filterDate;
    case 'is_on_or_before':
      return rowDate <= filterDate;
    case 'is_after':
      return rowDate > filterDate;
    case 'is_before':
      return rowDate < filterDate;
    default:
      return true;
  }
};

const matchArrayFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes
): boolean => {
  const values = Array.isArray(value) ? value : [];

  if (filter.operator === 'is_empty') {
    return values.length === 0;
  }

  if (filter.operator === 'is_not_empty') {
    return values.length > 0;
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return true;
  }

  if (filter.operator === 'is_in') {
    return filter.value.some((item) => values.includes(item));
  }

  if (filter.operator === 'is_not_in') {
    return !filter.value.some((item) => values.includes(item));
  }

  return true;
};

const matchSelectFilter = (
  value: unknown,
  filter: DatabaseViewFieldFilterAttributes
): boolean => {
  if (filter.operator === 'is_empty') {
    return isMissing(value);
  }

  if (filter.operator === 'is_not_empty') {
    return !isMissing(value);
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return true;
  }

  const selected = typeof value === 'string' ? value : null;

  if (filter.operator === 'is_in') {
    return selected != null && filter.value.includes(selected);
  }

  if (filter.operator === 'is_not_in') {
    return selected == null || !filter.value.includes(selected);
  }

  return true;
};

const matchFieldFilter = (
  row: CollectionRow,
  filter: DatabaseViewFieldFilterAttributes,
  fieldsById: Record<string, FieldAttributes>,
  userId: string
): boolean => {
  const value = getRowValue(row, filter.fieldId, fieldsById);

  if (filter.fieldId === SpecialId.Name) {
    return matchStringFilter(value, filter);
  }

  const field = fieldsById[filter.fieldId];
  if (!field) {
    return true;
  }

  switch (field.type) {
    case 'boolean':
      return matchBooleanFilter(value, filter);
    case 'created_at':
      return matchDateFilter(value, filter, false);
    case 'created_by':
      if (filter.operator === 'is_me') {
        return row.createdBy === userId;
      }
      if (filter.operator === 'is_not_me') {
        return row.createdBy !== userId;
      }
      if (isStringArray(filter.value) && filter.value.length > 0) {
        const matches = filter.value.includes(row.createdBy);
        return filter.operator === 'is_in' ? matches : !matches;
      }
      return true;
    case 'date':
      return matchDateFilter(value, filter, true);
    case 'email':
    case 'phone':
    case 'text':
    case 'url':
      return matchStringFilter(value, filter);
    case 'multi_select':
    case 'relation':
      return matchArrayFilter(value, filter);
    case 'number':
      return matchNumberFilter(value, filter);
    case 'select':
      return matchSelectFilter(value, filter);
    case 'updated_at':
      return matchDateFilter(value, filter, true);
    case 'updated_by':
      if (filter.operator === 'is_empty') {
        return isMissing(row.updatedBy);
      }
      if (filter.operator === 'is_not_empty') {
        return !isMissing(row.updatedBy);
      }
      if (filter.operator === 'is_me') {
        return row.updatedBy === userId;
      }
      if (filter.operator === 'is_not_me') {
        return row.updatedBy !== userId;
      }
      return true;
    default:
      return true;
  }
};

const matchFilter = (
  row: CollectionRow,
  filter: DatabaseViewFilterAttributes,
  fieldsById: Record<string, FieldAttributes>,
  userId: string
): boolean => {
  if (filter.type === 'group') {
    const results = filter.filters.map((nested) =>
      matchFieldFilter(row, nested, fieldsById, userId)
    );

    return filter.operator === 'or'
      ? results.some(Boolean)
      : results.every(Boolean);
  }

  return matchFieldFilter(row, filter, fieldsById, userId);
};

const compareValues = (left: unknown, right: unknown): number => {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left).localeCompare(String(right));
};

const getSortValue = (
  row: CollectionRow,
  fieldId: string,
  fieldsById: Record<string, FieldAttributes>
): unknown => {
  if (fieldId === SpecialId.Name) {
    return row.name;
  }

  const field = fieldsById[fieldId];
  if (!field) {
    return undefined;
  }

  if (field.type === 'created_at') {
    return row.createdAt;
  }

  if (field.type === 'created_by') {
    return row.createdBy;
  }

  const fieldValue = row.fields[field.id] as FieldValue | undefined;
  return fieldValue?.value;
};

export const filterCollectionRows = (
  rows: CollectionRow[],
  filter: DatabaseViewFilterAttributes,
  fields: FieldAttributes[],
  userId: string
): CollectionRow[] => {
  return applyCollectionViewQuery(rows, [filter], [], fields, userId);
};

export const applyCollectionViewQuery = (
  rows: CollectionRow[],
  filters: DatabaseViewFilterAttributes[],
  sorts: DatabaseViewSortAttributes[],
  fields: FieldAttributes[],
  userId: string
): CollectionRow[] => {
  const fieldsById = fields.reduce<Record<string, FieldAttributes>>(
    (acc, field) => {
      acc[field.id] = field;
      return acc;
    },
    {}
  );

  const filtered = rows.filter((row) =>
    filters.every((filter) => matchFilter(row, filter, fieldsById, userId))
  );

  if (sorts.length === 0) {
    return filtered.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [...filtered].sort((left, right) => {
    for (const sort of sorts) {
      const leftValue = getSortValue(left, sort.fieldId, fieldsById);
      const rightValue = getSortValue(right, sort.fieldId, fieldsById);
      const comparison = compareValues(leftValue, rightValue);

      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }
    }

    return left.id.localeCompare(right.id);
  });
};
