export type SelectOptionDeleteMutationInput = {
  type: 'select.option.delete';
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
    'select.option.delete': {
      input: SelectOptionDeleteMutationInput;
      output: SelectOptionDeleteMutationOutput;
    };
  }
}
