export type DatabaseCreateMutationInput = {
  type: 'database_create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  name: string;
  avatar?: string | null;
};

export type DatabaseCreateMutationOutput = {
  id: string;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    database_create: {
      input: DatabaseCreateMutationInput;
      output: DatabaseCreateMutationOutput;
    };
  }
}
