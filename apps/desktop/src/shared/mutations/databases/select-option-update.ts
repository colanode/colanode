export type SelectOptionUpdateMutationInput = {
  type: 'select_option_update';
  userId: string;
  databaseId: string;
  fieldId: string;
  optionId: string;
  name: string;
  color: string;
};

export type SelectOptionUpdateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    select_option_update: {
      input: SelectOptionUpdateMutationInput;
      output: SelectOptionUpdateMutationOutput;
    };
  }
}
