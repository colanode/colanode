export type FileCreateMutationInput = {
  type: 'file.create';
  userId: string;
  parentId: string;
  tempFileId: string;
};

export type FileCreateMutationOutput = {
  id: string | null;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'file.create': {
      input: FileCreateMutationInput;
      output: FileCreateMutationOutput;
    };
  }
}
