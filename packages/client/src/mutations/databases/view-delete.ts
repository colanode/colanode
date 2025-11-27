export type ViewDeleteMutationInput = {
  type: 'view.delete';
  userId: string;
  viewId: string;
};

export type ViewDeleteMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'view.delete': {
      input: ViewDeleteMutationInput;
      output: ViewDeleteMutationOutput;
    };
  }
}
