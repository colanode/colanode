export type ViewCreateMutationInput = {
  type: 'view.create';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  viewType: 'table' | 'board' | 'calendar';
  name: string;
};

export type ViewCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'view.create': {
      input: ViewCreateMutationInput;
      output: ViewCreateMutationOutput;
    };
  }
}
