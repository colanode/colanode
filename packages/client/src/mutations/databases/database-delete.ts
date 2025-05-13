export type DatabaseDeleteMutationInput = {
  type: 'database_delete';
  accountId: string;
  workspaceId: string;
  databaseId: string;
};

export type DatabaseDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    database_delete: {
      input: DatabaseDeleteMutationInput;
      output: DatabaseDeleteMutationOutput;
    };
  }
}
