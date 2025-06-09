export type FieldNameUpdateMutationInput = {
  type: 'field.name.update';
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
    'field.name.update': {
      input: FieldNameUpdateMutationInput;
      output: FieldNameUpdateMutationOutput;
    };
  }
}
