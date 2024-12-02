export type SelectOptionCreateMutationInput = {
  type: 'select_option_create';
  userId: string;
  databaseId: string;
  fieldId: string;
  name: string;
  color: string;
};

export type SelectOptionCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    select_option_create: {
      input: SelectOptionCreateMutationInput;
      output: SelectOptionCreateMutationOutput;
    };
  }
}
