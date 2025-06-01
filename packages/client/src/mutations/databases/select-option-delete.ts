export type SelectOptionDeleteMutationInput = {
  type: 'select_option_delete';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  fieldId: string;
  optionId: string;
};

export type SelectOptionDeleteMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    select_option_delete: {
      input: SelectOptionDeleteMutationInput;
      output: SelectOptionDeleteMutationOutput;
    };
  }
}
