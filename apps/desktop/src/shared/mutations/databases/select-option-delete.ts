export type SelectOptionDeleteMutationInput = {
  type: 'select_option_delete';
  userId: string;
  databaseId: string;
  fieldId: string;
  optionId: string;
};

export type SelectOptionDeleteMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    select_option_delete: {
      input: SelectOptionDeleteMutationInput;
      output: SelectOptionDeleteMutationOutput;
    };
  }
}
