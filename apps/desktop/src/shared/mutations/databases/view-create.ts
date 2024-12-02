export type ViewCreateMutationInput = {
  type: 'view_create';
  userId: string;
  databaseId: string;
  viewType: 'table' | 'board' | 'calendar';
  name: string;
  groupBy: string | null;
};

export type ViewCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    view_create: {
      input: ViewCreateMutationInput;
      output: ViewCreateMutationOutput;
    };
  }
}
