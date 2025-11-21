import {
  Ref,
  and,
  coalesce,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  isUndefined,
  length,
  lt,
  lte,
  not,
  or,
  useLiveInfiniteQuery,
} from '@tanstack/react-db';
import { useMemo } from 'react';

import { LocalRecordNode } from '@colanode/client/types';
import {
  DatabaseViewFieldFilterAttributes,
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
  FieldAttributes,
  SpecialId,
  isStringArray,
} from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

const RECORDS_PER_PAGE = 100;

type BooleanExpression = ReturnType<typeof eq>;
type RecordRef = Ref<LocalRecordNode>;

type OrderByDefinition = {
  direction: DatabaseViewSortAttributes['direction'];
  selector: (record: RecordRef) => unknown;
};

type FieldValuePrimitive =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

type ExpressionValue<T> =
  | T
  | Ref<T>
  | Ref<T | null>
  | Ref<T | undefined>
  | null
  | undefined;

type StringValueExpression = Parameters<typeof ilike>[0];
type NumberValueExpression = ExpressionValue<number>;
type BooleanValueExpression = ExpressionValue<boolean>;
type ArrayValueExpression = ExpressionValue<string[]>;

const DEFAULT_ORDERING: OrderByDefinition = {
  direction: 'asc',
  selector: (record) => record.id,
};

export const useRecordsInfiniteQuery = (
  filters: DatabaseViewFilterAttributes[],
  sorts: DatabaseViewSortAttributes[],
  count?: number
) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const pageSize = count ?? RECORDS_PER_PAGE;
  const fieldsById = useMemo(
    () => buildFieldsById(database.fields ?? []),
    [database.fields]
  );

  const hasFilterDefinitions = useMemo(
    () => hasUsableFilters(filters, fieldsById),
    [filters, fieldsById]
  );

  const result = useLiveInfiniteQuery(
    (q) => {
      let query = q
        .from({ records: workspace.collections.records })
        .where(({ records }) => eq(records.databaseId, database.id));

      if (hasFilterDefinitions) {
        query = query.where(({ records }) => {
          return (
            buildFiltersExpression(
              filters,
              fieldsById,
              workspace.userId,
              records
            ) ?? eq(1, 1)
          );
        });
      }

      const orderings = buildSortDefinitions(sorts, fieldsById);
      const effectiveOrderings =
        orderings.length > 0 ? orderings : [DEFAULT_ORDERING];

      effectiveOrderings.forEach(({ selector, direction }) => {
        query = query.orderBy(({ records }) => selector(records), direction);
      });

      return query;
    },
    {
      pageSize: pageSize,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === pageSize ? allPages.length : undefined,
    },
    [workspace.userId, database.id, database.fields, filters, sorts, pageSize]
  );

  return result;
};

const buildFieldsById = (fields: FieldAttributes[]) => {
  return fields.reduce<Record<string, FieldAttributes>>((acc, field) => {
    acc[field.id] = field;
    return acc;
  }, {});
};

const hasUsableFilters = (
  filters: DatabaseViewFilterAttributes[],
  fieldsById: Record<string, FieldAttributes>
): boolean => {
  return filters.some((filter) => {
    if (filter.type === 'group') {
      return filter.filters.some((nested) =>
        hasFieldReference(nested.fieldId, fieldsById)
      );
    }

    return hasFieldReference(filter.fieldId, fieldsById);
  });
};

const hasFieldReference = (
  fieldId: string,
  fieldsById: Record<string, FieldAttributes>
) => {
  if (fieldId === SpecialId.Name) {
    return true;
  }

  return fieldsById[fieldId] != null;
};

const buildSortDefinitions = (
  sorts: DatabaseViewSortAttributes[],
  fieldsById: Record<string, FieldAttributes>
): OrderByDefinition[] => {
  return sorts
    .map((sort) => createSortDefinition(sort, fieldsById))
    .filter((sort): sort is OrderByDefinition => sort != null);
};

const createSortDefinition = (
  sort: DatabaseViewSortAttributes,
  fieldsById: Record<string, FieldAttributes>
): OrderByDefinition | null => {
  if (sort.fieldId === SpecialId.Name) {
    return {
      direction: sort.direction,
      selector: (record) => record.name,
    };
  }

  const field = fieldsById[sort.fieldId];
  if (!field) {
    return null;
  }

  if (field.type === 'created_at') {
    return {
      direction: sort.direction,
      selector: (record) => record.createdAt,
    };
  }

  if (field.type === 'created_by') {
    return {
      direction: sort.direction,
      selector: (record) => record.createdBy,
    };
  }

  return {
    direction: sort.direction,
    selector: (record) => record.fields[field.id]?.value,
  };
};

const buildFiltersExpression = (
  filters: DatabaseViewFilterAttributes[],
  fieldsById: Record<string, FieldAttributes>,
  currentUserId: string,
  record: RecordRef
): BooleanExpression | null => {
  const expressions = filters
    .map((filter) =>
      filter.type === 'group'
        ? buildFilterGroupExpression(filter, fieldsById, currentUserId, record)
        : buildFieldFilterExpression(filter, fieldsById, currentUserId, record)
    )
    .filter(
      (expression): expression is BooleanExpression => expression != null
    );

  return combineWithAnd(expressions);
};

const buildFilterGroupExpression = (
  filter: Extract<DatabaseViewFilterAttributes, { type: 'group' }>,
  fieldsById: Record<string, FieldAttributes>,
  currentUserId: string,
  record: RecordRef
) => {
  const expressions = filter.filters
    .map((nestedFilter) =>
      buildFieldFilterExpression(
        nestedFilter,
        fieldsById,
        currentUserId,
        record
      )
    )
    .filter(
      (expression): expression is BooleanExpression => expression != null
    );

  return filter.operator === 'or'
    ? combineWithOr(expressions)
    : combineWithAnd(expressions);
};

const buildFieldFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  fieldsById: Record<string, FieldAttributes>,
  currentUserId: string,
  record: RecordRef
): BooleanExpression | null => {
  if (filter.fieldId === SpecialId.Name) {
    return buildStringFilterExpression(filter, record.name);
  }

  const field = fieldsById[filter.fieldId];
  if (!field) {
    return null;
  }

  switch (field.type) {
    case 'boolean':
      return buildBooleanFilterExpression(filter, record, field.id);
    case 'collaborator':
      return buildCollaboratorFilterExpression(
        filter,
        record,
        field.id,
        currentUserId
      );
    case 'created_at':
      return buildDateComparisonExpression(filter, record.createdAt, false);
    case 'created_by':
      return buildCreatedByFilterExpression(filter, record, currentUserId);
    case 'date':
      return buildDateComparisonExpression(
        filter,
        getFieldValue<StringValueExpression>(record, field.id),
        true
      );
    case 'email':
      return buildStringFilterExpression(
        filter,
        getFieldValue<StringValueExpression>(record, field.id)
      );
    case 'file':
      return null;
    case 'multi_select':
      return buildArrayFieldFilterExpression(filter, record, field.id);
    case 'number':
      return buildNumberFilterExpression(filter, record, field.id);
    case 'phone':
      return buildStringFilterExpression(
        filter,
        getFieldValue<StringValueExpression>(record, field.id)
      );
    case 'relation':
      return buildArrayFieldFilterExpression(filter, record, field.id);
    case 'select':
      return buildSelectFilterExpression(filter, record, field.id);
    case 'text':
      return buildStringFilterExpression(
        filter,
        getFieldValue<StringValueExpression>(record, field.id)
      );
    case 'url':
      return buildStringFilterExpression(
        filter,
        getFieldValue<StringValueExpression>(record, field.id)
      );
    case 'updated_at':
      return buildDateComparisonExpression(filter, record.updatedAt, true);
    case 'updated_by':
      return buildUpdatedByFilterExpression(filter, record, currentUserId);
    default:
      return null;
  }
};

const buildBooleanFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  fieldId: string
) => {
  const fieldValue = getFieldValue<BooleanValueExpression>(record, fieldId);
  if (filter.operator === 'is_true') {
    return eq(fieldValue, true);
  }

  if (filter.operator === 'is_false') {
    return or(eq(fieldValue, false), isValueMissing(fieldValue));
  }

  return null;
};

const buildCollaboratorFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  fieldId: string,
  currentUserId: string
) => {
  const fieldValue = getFieldValue<ArrayValueExpression>(record, fieldId);
  if (filter.operator === 'is_empty') {
    return buildArrayIsEmpty(fieldValue);
  }

  if (filter.operator === 'is_not_empty') {
    return buildArrayIsNotEmpty(fieldValue);
  }

  if (filter.operator === 'is_me') {
    return buildArrayContains(fieldValue, [currentUserId]);
  }

  if (filter.operator === 'is_not_me') {
    return buildArrayDoesNotContain(fieldValue, [currentUserId]);
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return null;
  }

  if (filter.operator === 'is_in') {
    return buildArrayContains(fieldValue, filter.value);
  }

  if (filter.operator === 'is_not_in') {
    return buildArrayDoesNotContain(fieldValue, filter.value);
  }

  return null;
};

const buildCreatedByFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  currentUserId: string
) => {
  if (filter.operator === 'is_me') {
    return eq(record.createdBy, currentUserId);
  }

  if (filter.operator === 'is_not_me') {
    return not(eq(record.createdBy, currentUserId));
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return null;
  }

  const comparisons = filter.value.map((value) => eq(record.createdBy, value));
  const combined = combineWithOr(comparisons);

  if (!combined) {
    return null;
  }

  return filter.operator === 'is_in' ? combined : not(combined);
};

const buildUpdatedByFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  currentUserId: string
) => {
  if (filter.operator === 'is_empty') {
    return isValueMissing(record.updatedBy);
  }

  if (filter.operator === 'is_not_empty') {
    return isValuePresent(record.updatedBy);
  }

  if (filter.operator === 'is_me') {
    return eq(record.updatedBy, currentUserId);
  }

  if (filter.operator === 'is_not_me') {
    return not(eq(record.updatedBy, currentUserId));
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return null;
  }

  const comparisons = filter.value.map((value) => eq(record.updatedBy, value));
  const combined = combineWithOr(comparisons);

  if (!combined) {
    return null;
  }

  return filter.operator === 'is_in' ? combined : not(combined);
};

const buildDateComparisonExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  valueRef: StringValueExpression,
  includeEmptyChecks: boolean
): BooleanExpression | null => {
  if (includeEmptyChecks) {
    if (filter.operator === 'is_empty') {
      return isValueMissing(valueRef);
    }

    if (filter.operator === 'is_not_empty') {
      return isValuePresent(valueRef);
    }
  }

  const value = normalizeDateValue(filter.value);
  if (!value) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return eq(valueRef, value);
    case 'is_not_equal_to':
      return not(eq(valueRef, value));
    case 'is_on_or_after':
      return gte(valueRef, value);
    case 'is_on_or_before':
      return lte(valueRef, value);
    case 'is_after':
      return gt(valueRef, value);
    case 'is_before':
      return lt(valueRef, value);
    default:
      return null;
  }
};

const buildNumberFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  fieldId: string
) => {
  const fieldValue = getFieldValue<NumberValueExpression>(record, fieldId);
  if (filter.operator === 'is_empty') {
    return isValueMissing(fieldValue);
  }

  if (filter.operator === 'is_not_empty') {
    return isValuePresent(fieldValue);
  }

  if (typeof filter.value !== 'number' || Number.isNaN(filter.value)) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return eq(fieldValue, filter.value);
    case 'is_not_equal_to':
      return not(eq(fieldValue, filter.value));
    case 'is_greater_than':
      return gt(fieldValue, filter.value);
    case 'is_less_than':
      return lt(fieldValue, filter.value);
    case 'is_greater_than_or_equal_to':
      return gte(fieldValue, filter.value);
    case 'is_less_than_or_equal_to':
      return lte(fieldValue, filter.value);
    default:
      return null;
  }
};

const buildStringFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  valueRef: StringValueExpression
): BooleanExpression | null => {
  if (filter.operator === 'is_empty') {
    return isValueMissing(valueRef);
  }

  if (filter.operator === 'is_not_empty') {
    return isValuePresent(valueRef);
  }

  const value = getStringFilterValue(filter.value);
  if (!value) {
    return null;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return eq(valueRef, value);
    case 'is_not_equal_to':
      return not(eq(valueRef, value));
    case 'contains':
      return ilike(valueRef, `%${value}%`);
    case 'does_not_contain':
      return not(ilike(valueRef, `%${value}%`));
    case 'starts_with':
      return ilike(valueRef, `${value}%`);
    case 'ends_with':
      return ilike(valueRef, `%${value}`);
    default:
      return null;
  }
};

const buildArrayFieldFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  fieldId: string
): BooleanExpression | null => {
  const fieldValue = getFieldValue<ArrayValueExpression>(record, fieldId);
  if (filter.operator === 'is_empty') {
    return buildArrayIsEmpty(fieldValue);
  }

  if (filter.operator === 'is_not_empty') {
    return buildArrayIsNotEmpty(fieldValue);
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return null;
  }

  if (filter.operator === 'is_in') {
    return buildArrayContains(fieldValue, filter.value);
  }

  if (filter.operator === 'is_not_in') {
    return buildArrayDoesNotContain(fieldValue, filter.value);
  }

  return null;
};

const buildSelectFilterExpression = (
  filter: DatabaseViewFieldFilterAttributes,
  record: RecordRef,
  fieldId: string
) => {
  const fieldValue = getFieldValue<StringValueExpression>(record, fieldId);
  if (filter.operator === 'is_empty') {
    return isValueMissing(fieldValue);
  }

  if (filter.operator === 'is_not_empty') {
    return isValuePresent(fieldValue);
  }

  if (!isStringArray(filter.value) || filter.value.length === 0) {
    return null;
  }

  const comparisons = filter.value.map((value) => eq(fieldValue, value));
  const combined = combineWithOr(comparisons);

  if (!combined) {
    return null;
  }

  return filter.operator === 'is_in' ? combined : not(combined);
};

const getFieldValue = <T = FieldValuePrimitive>(
  record: RecordRef,
  fieldId: string
): T => {
  return record.fields[fieldId]?.value as unknown as T;
};

const buildArrayIsEmpty = (
  valueRef: ArrayValueExpression
): BooleanExpression => {
  return or(isValueMissing(valueRef), eq(length(coalesce(valueRef, [])), 0));
};

const buildArrayIsNotEmpty = (
  valueRef: ArrayValueExpression
): BooleanExpression => {
  return gt(length(coalesce(valueRef, [])), 0);
};

const buildArrayContains = (
  valueRef: ArrayValueExpression,
  values: readonly string[]
): BooleanExpression | null => {
  if (values.length === 0) {
    return null;
  }

  const normalized = coalesce(valueRef, [] as string[]);
  const expressions = values.map((value) => inArray(value, normalized));
  return combineWithOr(expressions);
};

const buildArrayDoesNotContain = (
  valueRef: ArrayValueExpression,
  values: readonly string[]
): BooleanExpression | null => {
  const contains = buildArrayContains(valueRef, values);
  return contains ? not(contains) : null;
};

const combineWithAnd = (
  expressions: BooleanExpression[]
): BooleanExpression | null => {
  if (expressions.length === 0) {
    return null;
  }

  let result: BooleanExpression | null = null;
  for (const expression of expressions) {
    result = result ? and(result, expression) : expression;
  }

  return result;
};

const combineWithOr = (
  expressions: BooleanExpression[]
): BooleanExpression | null => {
  if (expressions.length === 0) {
    return null;
  }

  let result: BooleanExpression | null = null;
  for (const expression of expressions) {
    result = result ? or(result, expression) : expression;
  }

  return result;
};

const isValueMissing = (value: unknown): BooleanExpression => {
  return or(isNull(value), isUndefined(value));
};

const isValuePresent = (value: unknown): BooleanExpression => {
  return not(isValueMissing(value));
};

const getStringFilterValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  return value.length > 0 ? value : null;
};

const normalizeDateValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0] ?? null;
};
