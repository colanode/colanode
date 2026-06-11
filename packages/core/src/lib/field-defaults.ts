import type { FieldAttributes } from '@colanode/core/registry/nodes/field';
import type { FieldValue } from '@colanode/core/registry/nodes/field-value';

const SCHEMA_DEFAULT_UNSUPPORTED_TYPES = new Set<FieldAttributes['type']>([
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'relation',
  'rollup',
  'resource',
  'file',
]);

export const supportsFieldSchemaDefault = (field: FieldAttributes): boolean => {
  return !SCHEMA_DEFAULT_UNSUPPORTED_TYPES.has(field.type);
};

export const fieldDefaultToFieldValue = (
  field: FieldAttributes
): FieldValue | null => {
  if (!supportsFieldSchemaDefault(field) || !('default' in field)) {
    return null;
  }

  const defaultValue = field.default;
  if (defaultValue === undefined || defaultValue === null) {
    return null;
  }

  switch (field.type) {
    case 'boolean':
      if (typeof defaultValue !== 'boolean') {
        return null;
      }
      return { type: 'boolean', value: defaultValue };
    case 'number':
      if (typeof defaultValue !== 'number') {
        return null;
      }
      return { type: 'number', value: defaultValue };
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'collaborator':
      if (typeof defaultValue !== 'string' || defaultValue.length === 0) {
        return null;
      }
      return { type: 'string', value: defaultValue };
    case 'select':
      if (typeof defaultValue !== 'string') {
        return null;
      }
      if (field.options && !field.options[defaultValue]) {
        return null;
      }
      return { type: 'string', value: defaultValue };
    case 'multi_select':
      if (!Array.isArray(defaultValue) || defaultValue.length === 0) {
        return null;
      }
      if (
        field.options &&
        defaultValue.some((optionId) => !field.options![optionId])
      ) {
        return null;
      }
      return { type: 'string_array', value: defaultValue };
    default:
      return null;
  }
};

export const generateSchemaDefaultFieldValues = (
  fields: Iterable<FieldAttributes>
): Record<string, FieldValue> => {
  const fieldValues: Record<string, FieldValue> = {};

  for (const field of fields) {
    const value = fieldDefaultToFieldValue(field);
    if (value) {
      fieldValues[field.id] = value;
    }
  }

  return fieldValues;
};

export const mergeFieldValues = (
  ...sources: Array<Record<string, FieldValue>>
): Record<string, FieldValue> => {
  return Object.assign({}, ...sources);
};
