export type FileDeleteMutationInput = {
  type: 'file_delete';
  userId: string;
  fileId: string;
};

export type FileDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_delete: {
      input: FileDeleteMutationInput;
      output: FileDeleteMutationOutput;
    };
  }
}
