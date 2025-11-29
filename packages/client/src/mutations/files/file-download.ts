export type FileDownloadMutationInput = {
  type: 'file.download';
  userId: string;
  fileId: string;
  path: string;
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
