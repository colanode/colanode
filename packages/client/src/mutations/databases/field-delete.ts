export type FieldDeleteMutationInput = {
  type: 'field_delete';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  fieldId: string;
};

export type FieldDeleteMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    field_delete: {
      input: FieldDeleteMutationInput;
      output: FieldDeleteMutationOutput;
    };
  }
}
