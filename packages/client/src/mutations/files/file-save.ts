export type FileSaveMutationInput = {
  type: 'file.save';
  accountId: string;
  workspaceId: string;
  fileId: string;
  path: string;
};

export type FileSaveMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'file.save': {
      input: FileSaveMutationInput;
      output: FileSaveMutationOutput;
    };
  }
}
