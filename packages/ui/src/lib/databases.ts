import { LocalRecordNode } from '@colanode/client/types';
import {
  compareString,
  FieldAttributes,
  FieldType,
  FieldValue,
  generateFractionalIndex,
  isStringArray,
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
  DatabaseViewFieldAttributes,
  DatabaseViewFilterAttributes,
  DatabaseViewLayout,
  DatabaseViewFieldFilterAttributes,
} from '@colanode/core';

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

export const getDefaultViewFieldDisplay = (
  layout: DatabaseViewLayout
): boolean => {
  return layout === 'table';
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

export const nameFieldFilterOperators: FieldFilterOperator[] = [
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

export const relationFieldFilterOperators: FieldFilterOperator[] = [
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

export const updatedByFieldFilterOperators: FieldFilterOperator[] = [
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

export const updatedAtFieldFilterOperators: FieldFilterOperator[] = [
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

export const getFieldFilterOperators = (
  type: FieldType
): FieldFilterOperator[] => {
  if (!type) return [];

  switch (type) {
    case 'boolean':
      return booleanFieldFilterOperators;
    case 'collaborator':
      return collaboratorFieldFilterOperators;
    case 'created_at':
      return createdAtFieldFilterOperators;
    case 'created_by':
      return createdByFieldFilterOperators;
    case 'date':
      return dateFieldFilterOperators;
    case 'email':
      return emailFieldFilterOperators;
    case 'file':
      return fileFieldFilterOperators;
    case 'multi_select':
      return multiSelectFieldFilterOperators;
    case 'number':
      return numberFieldFilterOperators;
    case 'phone':
      return phoneFieldFilterOperators;
    case 'relation':
      return relationFieldFilterOperators;
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
  records: LocalRecordNode[],
  filter: DatabaseViewFilterAttributes,
  field: FieldAttributes,
  currentUserId: string
): LocalRecordNode[] => {
  return records.filter((record) =>
    recordMatchesFilter(record, filter, field, currentUserId)
  );
};

const recordMatchesFilter = (
  record: LocalRecordNode,
  filter: DatabaseViewFilterAttributes,
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
    case 'created_at':
      return recordMatchesCreatedAtFilter(record, filter);
    case 'created_by':
      return recordMatchesCreatedByFilter(record, filter, currentUserId);
    case 'date':
      return recordMatchesDateFilter(record, filter, field);
    case 'email':
      return recordMatchesEmailFilter(record, filter, field);
    case 'file':
      return recordMatchesFileFilter(record, filter, field);
    case 'multi_select':
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
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
  _: LocalRecordNode,
  __: DatabaseViewFilterAttributes,
  ___: FieldAttributes
) => {
  return false;
};

const recordMatchesCreatedAtFilter = (
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];
  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'string') {
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'string') {
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
  _: LocalRecordNode,
  __: DatabaseViewFilterAttributes,
  ___: FieldAttributes
) => {
  return false;
};

const recordMatchesMultiSelectFilter = (
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];
  const selectValues =
    fieldValue?.type === 'string_array' ? fieldValue.value : [];

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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'string') {
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'string') {
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
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
  record: LocalRecordNode,
  filter: DatabaseViewFieldFilterAttributes,
  field: FieldAttributes
) => {
  const fieldValue = record.attributes.fields[field.id];

  if (filter.operator === 'is_empty') {
    return !fieldValue;
  }

  if (filter.operator === 'is_not_empty') {
    return !!fieldValue;
  }

  if (!fieldValue || fieldValue.type !== 'string') {
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

export const isFilterableField = (_: FieldAttributes) => {
  // TODO: Implement this
  return true;
};

export const isSortableField = (field: FieldAttributes) => {
  return (
    field.type === 'text' ||
    field.type === 'number' ||
    field.type === 'date' ||
    field.type === 'created_at' ||
    field.type === 'email' ||
    field.type === 'phone' ||
    field.type === 'select' ||
    field.type === 'url'
  );
};

export const generateViewFieldIndex = (
  databaseFields: FieldAttributes[],
  viewFields: DatabaseViewFieldAttributes[],
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

  if (after === 'name') {
    const firstField = mergedIndexes[0];
    if (!firstField) {
      return null;
    }

    const nextIndex = firstField.viewIndex ?? firstField.databaseIndex;
    return generateFractionalIndex(null, nextIndex);
  }

  const afterFieldArrayIndex = mergedIndexes.findIndex((f) => f.id === after);
  if (afterFieldArrayIndex === -1) {
    return null;
  }

  const afterFieldIndex = mergedIndexes[afterFieldArrayIndex];
  if (!afterFieldIndex) {
    return null;
  }

  const previousIndex =
    afterFieldIndex?.viewIndex ?? afterFieldIndex?.databaseIndex ?? null;
  let nextIndex: string | null = null;

  if (afterFieldArrayIndex < mergedIndexes.length) {
    const nextFieldIndex = mergedIndexes[afterFieldArrayIndex + 1];
    nextIndex =
      nextFieldIndex?.viewIndex ?? nextFieldIndex?.databaseIndex ?? null;
  }

  let newIndex = generateFractionalIndex(previousIndex, nextIndex);

  const maxDatabaseIndex = mergedIndexes
    .map((f) => f.databaseIndex)
    .sort((a, b) => -compareString(a, b))[0]!;

  const newPotentialFieldIndex = generateFractionalIndex(
    maxDatabaseIndex,
    null
  );

  if (newPotentialFieldIndex === newIndex) {
    newIndex = generateFractionalIndex(previousIndex, newPotentialFieldIndex);
  }

  return newIndex;
};

export const generateFieldValuesFromFilters = (
  fields: FieldAttributes[],
  filters: DatabaseViewFilterAttributes[],
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
  filter: DatabaseViewFieldFilterAttributes,
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
    case 'multi_select': {
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
  filter: DatabaseViewFieldFilterAttributes
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
  filter: DatabaseViewFieldFilterAttributes,
  userId: string
): FieldValue | null => {
  if (filter.operator === 'is_me') {
    return { type: 'string_array', value: [userId] };
  }

  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'string_array', value: [firstValue] };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'string_array', value: [userId] };
  }

  return null;
};

const generateDateValue = (
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_on_or_after') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_on_or_before') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_after') {
    const date = new Date(filter.value);
    date.setDate(date.getDate() + 1);
    return { type: 'string', value: date.toISOString() };
  }

  if (filter.operator === 'is_before') {
    const date = new Date(filter.value);
    date.setDate(date.getDate() - 1);
    return { type: 'string', value: date.toISOString() };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'string', value: new Date().toISOString() };
  }

  return null;
};

const generateEmailValue = (
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'string', value: '#' };
  }

  return null;
};

const generateFileValue = (
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'string_array', value: [firstValue] };
  }

  return null;
};

const generateMultiSelectValue = (
  field: MultiSelectFieldAttributes,
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'string_array', value: [firstValue] };
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

    return { type: 'string_array', value: [firstOption.id] };
  }

  return null;
};

const generateNumberValue = (
  filter: DatabaseViewFieldFilterAttributes
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
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'string', value: '#' };
  }

  return null;
};

const generateSelectValue = (
  field: SelectFieldAttributes,
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (filter.operator === 'is_in' && Array.isArray(filter.value)) {
    const firstValue = filter.value[0];
    if (!firstValue) {
      return null;
    }

    return { type: 'string', value: firstValue };
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

    return { type: 'string', value: firstOption.id };
  }

  return null;
};

const generateTextValue = (
  filter: DatabaseViewFieldFilterAttributes
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
  filter: DatabaseViewFieldFilterAttributes
): FieldValue | null => {
  if (typeof filter.value !== 'string') {
    return null;
  }

  if (filter.operator === 'is_equal_to') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'contains') {
    return { type: 'string', value: filter.value };
  }

  if (filter.operator === 'is_not_empty') {
    return { type: 'string', value: '#' };
  }

  return null;
};
