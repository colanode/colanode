export type SelectOptionUpdateMutationInput = {
  type: 'select.option.update';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  fieldId: string;
  optionId: string;
  name: string;
  color: string;
};

export type SelectOptionUpdateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'select.option.update': {
      input: SelectOptionUpdateMutationInput;
      output: SelectOptionUpdateMutationOutput;
    };
  }
}
