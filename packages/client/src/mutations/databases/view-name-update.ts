export type ViewNameUpdateMutationInput = {
  type: 'view.name.update';
  userId: string;
  databaseId: string;
  viewId: string;
  name: string;
};

export type ViewNameUpdateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'view.name.update': {
      input: ViewNameUpdateMutationInput;
      output: ViewNameUpdateMutationOutput;
    };
  }
}
