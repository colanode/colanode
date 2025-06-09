export type FileDownloadMutationInput = {
  type: 'file.download';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

export type FileDownloadMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'file.download': {
      input: FileDownloadMutationInput;
      output: FileDownloadMutationOutput;
    };
  }
}
