import { FieldValue } from '@colanode/core';

export type RecordFieldValueSetMutationInput = {
  type: 'record_field_value_set';
  userId: string;
  recordId: string;
  fieldId: string;
  value: FieldValue;
};

export type RecordFieldValueSetMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_field_value_set: {
      input: RecordFieldValueSetMutationInput;
      output: RecordFieldValueSetMutationOutput;
    };
  }
}
