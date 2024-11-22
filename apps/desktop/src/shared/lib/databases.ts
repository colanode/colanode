import {
  FieldType,
  FieldAttributes,
  ViewFieldFilterAttributes,
  ViewFilterAttributes,
  ViewFieldAttributes,
  RecordNode,
  FieldValue,
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
  ViewType,
  generateNodeIndex,
} from '@colanode/core';
import { compareString, isStringArray } from '@/shared/lib/utils';

export const getDefaultFieldWidth = (type: FieldType): number => {
  if (!type) return 0;

  switch (type.toLowerCase()) {
    case 'name':
      return 200;
    case 'autonumber':
      return 150;
    case 'boolean':
      return 100;
    case 'button':
      return 100;
    case 'collaborator':
      return 200;
    case 'created_at':
      return 200;
    case 'created_by':
      return 200;
    case 'date':
      return 200;
    case 'email':
      return 200;
    case 'file':
      return 200;
    case 'formula':
      return 200;
    case 'multi_select':
      return 200;
    case 'number':
      return 150;
    case 'phone':
      return 200;
    case 'relation':
      return 200;
    case 'rollup':
      return 200;
    case 'select':
      return 200;
    case 'text':
      return 200;
    case 'updated_at':
      return 200;
    case 'updated_by':
      return 200;
    case 'url':
      return 200;
    default:
      return 200;
  }
};

export const getDefaultNameWidth = (): number => {
  return 300;
};

export const getDefaultViewFieldDisplay = (viewType: ViewType): boolean => {
  return viewType === 'table';
};

interface SelectOptionColor {
  label: string;
  value: string;
  class: string;
  lightClass: string;
}

export const selectOptionColors: SelectOptionColor[] = [
  {
    label: 'Gray',
    value: 'gray',
    class: 'bg-gray-200',
    lightClass: 'bg-gray-50',
  },
  {
    label: 'Orange',
    value: 'orange',
    class: 'bg-orange-200',
    lightClass: 'bg-orange-50',
  },
  {
    label: 'Yellow',
    value: 'yellow',
    class: 'bg-yellow-200',
    lightClass: 'bg-yellow-50',
  },
  {
    label: 'Green',
    value: 'green',
    class: 'bg-green-200',
    lightClass: 'bg-green-50',
  },
  {
    label: 'Blue',
    value: 'blue',
    class: 'bg-blue-200',
    lightClass: 'bg-blue-50',
  },
  {
    label: 'Purple',
    value: 'purple',
    class: 'bg-purple-200',
    lightClass: 'bg-purple-50',
  },
  {
    label: 'Pink',
    value: 'pink',
    class: 'bg-pink-200',
    lightClass: 'bg-pink-50',
  },
  {
    label: 'Red',
    value: 'red',
    class: 'bg-red-200',
    lightClass: 'bg-red-50',
  },
];

export const getSelectOptionColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.class || '';
};

export const getSelectOptionLightColorClass = (color: string): string => {
  return selectOptionColors.find((c) => c.value === color)?.lightClass || '';
};

export const getRandomSelectOptionColor = (): string => {
  const randomIndex = Math.floor(Math.random() * selectOptionColors.length);
  const randomColor = selectOptionColors[randomIndex] ?? selectOptionColors[0]!;

  return randomColor.value;
};

export interface FieldFilterOperator {
  label: string;
  value: string;
}

export const booleanFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is True',
    value: 'is_true',
  },
  {
    label: 'Is False',
    value: 'is_false',
  },
];

export const collaboratorFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Me',
    value: 'is_me',
  },
  {
    label: 'Is Not Me',
    value: 'is_not_me',
  },
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const createdAtFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is on or after',
    value: 'is_on_or_after',
  },
  {
    label: 'Is on or before',
    value: 'is_on_or_before',
  },
  {
    label: 'Is After',
    value: 'is_after',
  },
  {
    label: 'Is Before',
    value: 'is_before',
  },
];

export const createdByFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Me',
    value: 'is_me',
  },
  {
    label: 'Is Not Me',
    value: 'is_not_me',
  },
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
];

export const dateFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is on or after',
    value: 'is_on_or_after',
  },
  {
    label: 'Is on or before',
    value: 'is_on_or_before',
  },
  {
    label: 'Is After',
    value: 'is_after',
  },
  {
    label: 'Is Before',
    value: 'is_before',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const emailFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const fileFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const multiSelectFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const numberFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Is Greater Than',
    value: 'is_greater_than',
  },
  {
    label: 'Is Less Than',
    value: 'is_less_than',
  },
  {
    label: 'Is Greater Than Or Equal To',
    value: 'is_greater_than_or_equal_to',
  },
  {
    label: 'Is Less Than Or Equal To',
    value: 'is_less_than_or_equal_to',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const phoneFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
];

export const selectFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is In',
    value: 'is_in',
  },
  {
    label: 'Is Not In',
    value: 'is_not_in',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const textFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },

  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const urlFieldFilterOperators: FieldFilterOperator[] = [
  {
    label: 'Is Equal To',
    value: 'is_equal_to',
  },
  {
    label: 'Is Not Equal To',
    value: 'is_not_equal_to',
  },
  {
    label: 'Contains',
    value: 'contains',
  },
  {
    label: 'Does Not Contain',
    value: 'does_not_contain',
  },
  {
    label: 'Is Empty',
    value: 'is_empty',
  },
  {
    label: 'Is Not Empty',
    value: 'is_not_empty',
  },
];

export const getFieldFilterOperators = (
  type: FieldType
): FieldFilterOperator[] => {
  if (!type) return [];

  switch (type) {
    case 'boolean':
      return booleanFieldFilterOperators;
    case 'collaborator':
      return collaboratorFieldFilterOperators;
    case 'createdAt':
      return createdAtFieldFilterOperators;
    case 'createdBy':
      return createdByFieldFilterOperators;
    case 'date':
      return dateFieldFilterOperators;
    case 'email':
      return emailFieldFilterOperators;
    case 'file':
      return fileFieldFilterOperators;
    case 'multiSelect':
      return multiSelectFieldFilterOperators;
    case 'number':
      return numberFieldFilterOperators;
    case 'phone':
      return phoneFieldFilterOperators;
    case 'select':
      return selectFieldFilterOperators;
    case 'text':
      return textFieldFilterOperators;
    case 'url':
      return urlFieldFilterOperators;
    default:
      return [];
  }
};

export const filterRecords = (
  records: RecordNode[],
  filter: ViewFilterAttributes,
  field: FieldAttributes,
  currentUserId: string
): RecordNode[] => {
  return records.filter((record) =>
    recordMatchesFilter(record, filter, field, currentUserId)
  );
};

const recordMatchesFilter = (
  record: RecordNode,
  filter: ViewFilterAttributes,
  field: FieldAttributes,
  currentUserId: string
) => {
  if (filter.type === 'group') {
    return false;
  }

  switch (field.type) {
    case 'boolean':
      return recordMatchesBooleanFilter(record, filter, field);
    case 'collaborator':
      return recordMatchesCollaboratorFilter(record, filter, field);
    case 'createdAt':
      return recordMatchesCreatedAtFilter(record, filter);
    case 'createdBy':
      return recordMatchesCreatedByFilter(record, filter, currentUserId);
    case 'date':
      return recordMatchesDateFilter(record, filter, field);
    case 'email':
      return recordMatchesEmailFilter(record, filter, field);
    case 'file':
      return recordMatchesFileFilter(record, filter, field);
    case 'multiSelect':
      return recordMatchesMultiSelectFilter(record, filter, field);
    case 'number':
      return recordMatchesNumberFilter(record, filter, field);
    case 'phone':
      return recordMatchesPhoneFilter(record, filter, field);
    case 'select':
      return recordMatchesSelectFilter(record, filter, field);
    case 'text':
      return recordMatchesTextFilter(record, filter, field);
    case 'url':
      return recordMatchesUrlFilter(record, filter, field);
    default:
      return false;
  }
};

const recordMatchesBooleanFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];
  if (filter.operator === 'is_true') {
    return (
      fieldValue && fieldValue.type === 'boolean' && fieldValue.value === true
    );
  }

  if (filter.operator === 'is_false') {
    return (
      !fieldValue ||
      (fieldValue &&
        fieldValue.type === 'boolean' &&
        fieldValue.value === false)
    );
  }

  return false;
};

const recordMatchesCollaboratorFilter = (
  _: RecordNode,
  __: ViewFieldFilterAttributes,
  ___: FieldAttributes
) => {
  return false;
};

const recordMatchesCreatedAtFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes
) => {
  if (!filter.value) return false;

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterDate = new Date(filter.value);
  filterDate.setHours(0, 0, 0, 0); // Set time to midnight

  const recordDate = new Date(record.createdAt);
  recordDate.setHours(0, 0, 0, 0); // Set time to midnight

  switch (filter.operator) {
    case 'is_equal_to':
      return recordDate.getTime() === filterDate.getTime();
    case 'is_not_equal_to':
      return recordDate.getTime() !== filterDate.getTime();
    case 'is_on_or_after':
      return recordDate.getTime() >= filterDate.getTime();
    case 'is_on_or_before':
      return recordDate.getTime() <= filterDate.getTime();
    case 'is_after':
      return recordDate.getTime() > filterDate.getTime();
    case 'is_before':
      return recordDate.getTime() < filterDate.getTime();
  }

  return false;
};

const recordMatchesCreatedByFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  currentUserId: string
) => {
  const createdBy = record.createdBy;
  if (!createdBy) {
    return false;
  }

  if (filter.operator === 'is_me') {
    return createdBy === currentUserId;
  }

  if (filter.operator === 'is_not_me') {
    return createdBy !== currentUserId;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  if (filter.operator === 'is_in') {
    return filter.value.includes(createdBy);
  }

  if (filter.operator === 'is_not_in') {
    return !filter.value.includes(createdBy);
  }

  return false;
};

const recordMatchesDateFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];
  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'date') {
    return false;
  }

  const recordDate = new Date(fieldValue.value);
  recordDate.setHours(0, 0, 0, 0); // Set time to midnight

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterDate = new Date(filter.value);
  filterDate.setHours(0, 0, 0, 0); // Set time to midnight

  switch (filter.operator) {
    case 'is_equal_to':
      return recordDate.getTime() === filterDate.getTime();
    case 'is_not_equal_to':
      return recordDate.getTime() !== filterDate.getTime();
    case 'is_on_or_after':
      return recordDate.getTime() >= filterDate.getTime();
    case 'is_on_or_before':
      return recordDate.getTime() <= filterDate.getTime();
    case 'is_after':
      return recordDate.getTime() > filterDate.getTime();
    case 'is_before':
      return recordDate.getTime() < filterDate.getTime();
  }

  return false;
};

const recordMatchesEmailFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'email') {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue.value === filterValue;
    case 'is_not_equal_to':
      return fieldValue.value !== filterValue;
    case 'contains':
      return fieldValue.value.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.value.includes(filterValue);
  }

  return false;
};

const recordMatchesFileFilter = (
  _: RecordNode,
  __: ViewFieldFilterAttributes,
  ___: FieldAttributes
) => {
  return false;
};

const recordMatchesMultiSelectFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];
  const selectValues =
    fieldValue?.type === 'multiSelect' ? fieldValue.value : [];

  if (filter.operator === 'is_empty') {
    return selectValues.length === 0;
  }

  if (filter.operator === 'is_not_empty') {
    return selectValues.length > 0;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  switch (filter.operator) {
    case 'is_in':
      return filter.value.some((value) => selectValues.includes(value));
    case 'is_not_in':
      return !filter.value.some((value) => selectValues.includes(value));
  }

  return false;
};

const recordMatchesNumberFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'number') {
    return false;
  }

  if (typeof filter.value !== 'number') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue.value === filterValue;
    case 'is_not_equal_to':
      return fieldValue.value !== filterValue;
    case 'is_greater_than':
      return fieldValue.value > filterValue;
    case 'is_less_than':
      return fieldValue.value < filterValue;
    case 'is_greater_than_or_equal_to':
      return fieldValue.value >= filterValue;
    case 'is_less_than_or_equal_to':
      return fieldValue.value <= filterValue;
  }

  return false;
};

const recordMatchesPhoneFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'phone') {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue.value === filterValue;
    case 'is_not_equal_to':
      return fieldValue.value !== filterValue;
    case 'contains':
      return fieldValue.value.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.value.includes(filterValue);
  }

  return false;
};

const recordMatchesSelectFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'select') {
    return false;
  }

  if (!isStringArray(filter.value)) {
    return true;
  }

  const selectValues = fieldValue.value;

  switch (filter.operator) {
    case 'is_in':
      return filter.value.some((value) => selectValues.includes(value));
    case 'is_not_in':
      return !filter.value.some((value) => selectValues.includes(value));
  }

  return false;
};

const recordMatchesTextFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'text') {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue.value === filterValue;
    case 'is_not_equal_to':
      return fieldValue.value !== filterValue;
    case 'contains':
      return fieldValue.value.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.value.includes(filterValue);
  }

  return false;
};

const recordMatchesUrlFilter = (
  record: RecordNode,
  filter: ViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'url') {
    return false;
  }

  if (typeof filter.value !== 'string') {
    return true;
  }

  const filterValue = filter.value;
  if (!filterValue) {
    return true;
  }

  switch (filter.operator) {
    case 'is_equal_to':
      return fieldValue.value === filterValue;
    case 'is_not_equal_to':
      return fieldValue.value !== filterValue;
    case 'contains':
      return fieldValue.value.includes(filterValue);
    case 'does_not_contain':
      return !fieldValue.value.includes(filterValue);
  }

  return false;
};

export const isFilterableField = (field: FieldAttributes) => {
  // TODO: Implement this
  return true;
};

export const isSortableField = (field: FieldAttributes) => {
  return (
    field.type === 'text' ||
    field.type === 'number' ||
    field.type === 'date' ||
    field.type === 'createdAt' ||
    field.type === 'email' ||
    field.type === 'phone' ||
    field.type === 'select' ||
    field.type === 'url'
  );
};

export const generateViewFieldIndex = (
  databaseFields: FieldAttributes[],
  viewFields: ViewFieldAttributes[],
  fieldId: string,
  after: string
): string | null => {
  const field = databaseFields.find((f) => f.id === fieldId);
  if (!field) {
    return null;
  }

  if (databaseFields.length <= 1) {
    return null;
  }

  const mergedIndexes = databaseFields
    .map((f) => {
      const viewField = viewFields.find((vf) => vf.id === f.id);
      return {
        id: f.id,
        databaseIndex: f.index,
        viewIndex: viewField?.index ?? null,
      };
    })
    .sort((a, b) =>
      compareString(
        a.viewIndex ?? a.databaseIndex,
        b.viewIndex ?? b.databaseIndex
      )
    );

  let previousIndex: string | null = null;
  let nextIndex: string | null = null;
  if (after === 'name') {
    const lowestIndex = mergedIndexes[0];
    if (!lowestIndex) {
      return null;
    }

    nextIndex = lowestIndex.viewIndex ?? lowestIndex.databaseIndex;
  } else {
    const afterFieldArrayIndex = mergedIndexes.findIndex((f) => f.id === after);
    if (afterFieldArrayIndex === -1) {
      return null;
    }

    const afterFieldIndex = mergedIndexes[afterFieldArrayIndex];
    previousIndex =
      afterFieldIndex?.viewIndex ?? afterFieldIndex?.databaseIndex ?? null;

    if (afterFieldArrayIndex < mergedIndexes.length) {
      const nextFieldIndex = mergedIndexes[afterFieldArrayIndex + 1];
      nextIndex =
        nextFieldIndex?.viewIndex ?? nextFieldIndex?.databaseIndex ?? null;
    }
  }

  let newIndex = generateNodeIndex(previousIndex, nextIndex);

  const lastDatabaseField = mergedIndexes.sort((a, b) =>
    compareString(a.databaseIndex, b.databaseIndex)
  )[mergedIndexes.length - 1]!;

  const newPotentialFieldIndex = generateNodeIndex(
    lastDatabaseField.databaseIndex,
    null
  );

  if (newPotentialFieldIndex === newIndex) {
    newIndex = generateNodeIndex(previousIndex, newPotentialFieldIndex);
  }

  return newIndex;
};

export const generateFieldValuesFromFilters = (
  fields: FieldAttributes[],
  filters: ViewFilterAttributes[],
  userId: string
): Record<string, FieldValue> => {
  if (fields.length === 0 || filters.length === 0) {
    return {};
  }

  const fieldValues: Record<string, FieldValue> = {};

  for (const filter of filters) {
    if (filter.type !== 'field') continue;

    const field = fields.find((f) => f.id === filter.fieldId);
    if (!field) continue;

    const value = generateValueFromFilter(field, filter, userId);
    if (!value) continue;

    fieldValues[field.id] = value;
  }

  return fieldValues;
};

const generateValueFromFilter = (
  field: FieldAttributes,
  filter: ViewFieldFilterAttributes,
  userId: string
): FieldValue | null => {
  switch (field.type) {
    case 'boolean': {
      return generateBooleanValue(filter);
    }
    case 'collaborator': {
      return generateCollaboratorValue(filter, userId);
    }
    case 'date': {
      return generateDateValue(filter);
    }
    case 'email': {
      return generateEmailValue(filter);
    }
    case 'file': {
      return generateFileValue(filter);
    }
    case 'multiSelect': {
      return generateMultiSelectValue(field, filter);
    }
    case 'number': {
      return generateNumberValue(filter);
    }
    case 'phone': {
      return generatePhoneValue(filter);
    }
    case 'select': {
      return generateSelectValue(field, filter);
    }
    case 'text': {
      return generateTextValue(filter);
    }
    case 'url': {
      return generateUrlValue(filter);
    }
    default:
      return null;
  }
};

const generateBooleanValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_true') {
    return { type: 'boolean', value: true };
  }

  if (filter.operator === 'is_false') {
    return { type: 'boolean', value: false };
  }

  return null;
};

const generateCollaboratorValue = (
  filter: ViewFieldFilterAttributes,
  userId: string
): FieldValue | null => {
  if (filter.operator === 'is_me') {
    return { type: 'collaborator', value: [userId] };
  }

  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'collaborator', value: [firstValue] };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'collaborator', value: [userId] };
  }

  return null;
};

const generateDateValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'date', value: filter.value };
  }

  if (filter.operator === 'is_on_or_after') {
    return { type: 'date', value: filter.value };
  }

  if (filter.operator === 'is_on_or_before') {
    return { type: 'date', value: filter.value };
  }

  if (filter.operator === 'is_after') {
    const date = new Date(filter.value);
    date.setDate(date.getDate() + 1);
    return { type: 'date', value: date.toISOString() };
  }

  if (filter.operator === 'is_before') {
    const date = new Date(filter.value);
    date.setDate(date.getDate() - 1);
    return { type: 'date', value: date.toISOString() };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'date', value: new Date().toISOString() };
  }

  return null;
};

const generateEmailValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'email', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'email', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'email', value: '#' };
  }

  return null;
};

const generateFileValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'file', value: [firstValue] };
  }

  return null;
};

const generateMultiSelectValue = (
  field: MultiSelectFieldAttributes,
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'multiSelect', value: [firstValue] };
  }

  if (
    filter.operator === 'is_not_empty' &&
    field.options &&
    Object.keys(field.options).length > 0
  ) {
    const firstOption = Object.values(field.options)[0];
    if (!firstOption) {
      return null;
    }

    return { type: 'multiSelect', value: [firstOption.id] };
  }

  return null;
};

const generateNumberValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'number') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'number', value: filter.value };
  }

  if (filter.operator === 'is_greater_than') {
    return { type: 'number', value: filter.value + 1 };
  }

  if (filter.operator === 'is_less_than') {
    return { type: 'number', value: filter.value - 1 };
  }

  if (filter.operator === 'is_greater_than_or_equal_to') {
    return { type: 'number', value: filter.value };
  }

  if (filter.operator === 'is_less_than_or_equal_to') {
    return { type: 'number', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'number', value: 0 };
  }

  return null;
};

const generatePhoneValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'phone', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'phone', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'phone', value: '#' };
  }

  return null;
};

const generateSelectValue = (
  field: SelectFieldAttributes,
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'select', value: firstValue };
  }

  if (
    filter.operator === 'is_not_empty' &&
    field.options &&
    Object.keys(field.options).length > 0
  ) {
    const firstOption = Object.values(field.options)[0];
    if (!firstOption) {
      return null;
    }

    return { type: 'select', value: firstOption.id };
  }

  return null;
};

const generateTextValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'text', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'text', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'text', value: '#' };
  }

  return null;
};

const generateUrlValue = (
  filter: ViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'url', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'url', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'url', value: '#' };
  }

  return null;
};
