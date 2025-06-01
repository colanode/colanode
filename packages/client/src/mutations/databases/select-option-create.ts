export type SelectOptionCreateMutationInput = {
  type: 'select_option_create';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  fieldId: string;
  name: string;
  color: string;
};

export type SelectOptionCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    select_option_create: {
      input: SelectOptionCreateMutationInput;
      output: SelectOptionCreateMutationOutput;
    };
  }
}
