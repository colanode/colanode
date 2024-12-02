export type FieldNameUpdateMutationInput = {
  type: 'field_name_update';
  databaseId: string;
  fieldId: string;
  name: string;
  userId: string;
};

export type FieldNameUpdateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    field_name_update: {
      input: FieldNameUpdateMutationInput;
      output: FieldNameUpdateMutationOutput;
    };
  }
}
