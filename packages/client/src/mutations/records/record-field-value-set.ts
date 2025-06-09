import { FieldValue } from '@colanode/core';

export type RecordFieldValueSetMutationInput = {
  type: 'record.field.value.set';
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
    'record.field.value.set': {
      input: RecordFieldValueSetMutationInput;
      output: RecordFieldValueSetMutationOutput;
    };
  }
}
