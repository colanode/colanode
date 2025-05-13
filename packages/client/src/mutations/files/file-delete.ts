export type FileDeleteMutationInput = {
  type: 'file_delete';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

export type FileDeleteMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    file_delete: {
      input: FileDeleteMutationInput;
      output: FileDeleteMutationOutput;
    };
  }
}
