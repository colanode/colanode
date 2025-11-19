export type FileDeleteMutationInput = {
  type: 'file.delete';
  userId: string;
  fileId: string;
};

export type FileDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'file.delete': {
      input: FileDeleteMutationInput;
      output: FileDeleteMutationOutput;
    };
  }
}
