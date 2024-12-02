export type ViewNameUpdateMutationInput = {
  type: 'view_name_update';
  databaseId: string;
  viewId: string;
  name: string;
  userId: string;
};

export type ViewNameUpdateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    view_name_update: {
      input: ViewNameUpdateMutationInput;
      output: ViewNameUpdateMutationOutput;
    };
  }
}
