export type RecordFieldValueDeleteMutationInput = {
  type: 'record.field.value.delete';
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
    'record.field.value.delete': {
      input: RecordFieldValueDeleteMutationInput;
      output: RecordFieldValueDeleteMutationOutput;
    };
  }
}
