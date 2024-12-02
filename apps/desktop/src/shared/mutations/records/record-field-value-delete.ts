export type RecordFieldValueDeleteMutationInput = {
  type: 'record_field_value_delete';
  userId: string;
  recordId: string;
  fieldId: string;
};

export type RecordFieldValueDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_field_value_delete: {
      input: RecordFieldValueDeleteMutationInput;
      output: RecordFieldValueDeleteMutationOutput;
    };
  }
}
