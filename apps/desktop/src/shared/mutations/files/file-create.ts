export type FileCreateMutationInput = {
  type: 'file_create';
  userId: string;
  parentId: string;
  filePath: string;
};

export type FileCreateMutationOutput = {
  id: string | null;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_create: {
      input: FileCreateMutationInput;
      output: FileCreateMutationOutput;
    };
  }
}
