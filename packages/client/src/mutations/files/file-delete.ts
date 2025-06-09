export type FileDeleteMutationInput = {
  type: 'file.delete';
  accountId: string;
  workspaceId: string;
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
