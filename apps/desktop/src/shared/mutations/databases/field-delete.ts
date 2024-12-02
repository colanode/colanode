export type FieldDeleteMutationInput = {
  type: 'field_delete';
  databaseId: string;
  fieldId: string;
  userId: string;
};

export type FieldDeleteMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    field_delete: {
      input: FieldDeleteMutationInput;
      output: FieldDeleteMutationOutput;
    };
  }
}
