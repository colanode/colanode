export type DatabaseUpdateMutationInput = {
  type: 'database.update';
  userId: string;
  databaseId: string;
  name: string;
  avatar?: string | null;
};

export type DatabaseUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'database.update': {
      input: DatabaseUpdateMutationInput;
      output: DatabaseUpdateMutationOutput;
    };
  }
}
