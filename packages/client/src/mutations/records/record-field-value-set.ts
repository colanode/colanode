import { FieldValue } from '@colanode/core';

export type RecordFieldValueSetMutationInput = {
  type: 'record.field.value.set';
  userId: string;
  recordId: string;
  fieldId: string;
  value: FieldValue;
};

export type RecordFieldValueSetMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'record.field.value.set': {
      input: RecordFieldValueSetMutationInput;
      output: RecordFieldValueSetMutationOutput;
    };
  }
}
