export type DatabaseCreateMutationInput = {
  type: 'database.create';
  userId: string;
  parentId: string;
  name: string;
  avatar?: string | null;
};

export type DatabaseCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'database.create': {
      input: DatabaseCreateMutationInput;
      output: DatabaseCreateMutationOutput;
    };
  }
}
