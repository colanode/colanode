export type FieldNameUpdateMutationInput = {
  type: 'field_name_update';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  fieldId: string;
  name: string;
};

export type FieldNameUpdateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    field_name_update: {
      input: FieldNameUpdateMutationInput;
      output: FieldNameUpdateMutationOutput;
    };
  }
}
