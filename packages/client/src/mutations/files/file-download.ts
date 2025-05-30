export type FileDownloadMutationInput = {
  type: 'file_download';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

export type FileDownloadMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    file_download: {
      input: FileDownloadMutationInput;
      output: FileDownloadMutationOutput;
    };
  }
}
