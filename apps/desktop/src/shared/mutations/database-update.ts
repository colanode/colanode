export type DatabaseUpdateMutationInput = {
  type: 'database_update';
  userId: string;
  databaseId: string;
  name: string;
  avatar?: string | null;
};

export type DatabaseUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    database_update: {
      input: DatabaseUpdateMutationInput;
      output: DatabaseUpdateMutationOutput;
    };
  }
}
