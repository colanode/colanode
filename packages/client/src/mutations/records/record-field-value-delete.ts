export type RecordFieldValueDeleteMutationInput = {
  type: 'record_field_value_delete';
  accountId: string;
  workspaceId: string;
  recordId: string;
  fieldId: string;
};

export type RecordFieldValueDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    record_field_value_delete: {
      input: RecordFieldValueDeleteMutationInput;
      output: RecordFieldValueDeleteMutationOutput;
    };
  }
}
