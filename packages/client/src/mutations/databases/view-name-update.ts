export type ViewNameUpdateMutationInput = {
  type: 'view_name_update';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  viewId: string;
  name: string;
};

export type ViewNameUpdateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    view_name_update: {
      input: ViewNameUpdateMutationInput;
      output: ViewNameUpdateMutationOutput;
    };
  }
}
