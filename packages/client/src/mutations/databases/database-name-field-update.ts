export type DatabaseNameFieldUpdateMutationInput = {
  type: 'database.name.field.update';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  name: string;
};

export type DatabaseNameFieldUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'database.name.field.update': {
      input: DatabaseNameFieldUpdateMutationInput;
      output: DatabaseNameFieldUpdateMutationOutput;
    };
  }
}
