export type FileCreateMutationInput = {
  type: 'file_create';
  accountId: string;
  workspaceId: string;
  parentId: string;
  filePath: string;
};

export type FileCreateMutationOutput = {
  id: string | null;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    file_create: {
      input: FileCreateMutationInput;
      output: FileCreateMutationOutput;
    };
  }
}
