import {
  FieldAttributes,
  FieldValue,
  generateSchemaDefaultFieldValues,
  mergeFieldValues,
} from '@colanode/core';

type MetaTypeFieldsSource = {
  fields?: Record<string, FieldAttributes> | FieldAttributes[];
} | null | undefined;

export const resolveInitialPageFields = (
  metaType: MetaTypeFieldsSource,
  options?: {
    filterValues?: Record<string, FieldValue>;
    initialFields?: Record<string, FieldValue>;
  }
): Record<string, FieldValue> => {
  const schemaFields = Array.isArray(metaType?.fields)
    ? metaType.fields
    : Object.values(metaType?.fields ?? {});

  return mergeFieldValues(
    generateSchemaDefaultFieldValues(schemaFields),
    options?.filterValues ?? {},
    options?.initialFields ?? {}
  );
};
