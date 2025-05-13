import { FieldValue } from '@colanode/core';

export type RecordFieldValueSetMutationInput = {
  type: 'record_field_value_set';
  accountId: string;
  workspaceId: string;
  recordId: string;
  fieldId: string;
  value: FieldValue;
};

export type RecordFieldValueSetMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    record_field_value_set: {
      input: RecordFieldValueSetMutationInput;
      output: RecordFieldValueSetMutationOutput;
    };
  }
}
