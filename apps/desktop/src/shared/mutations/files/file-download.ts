export type FileDownloadMutationInput = {
  type: 'file_download';
  userId: string;
  fileId: string;
};

export type FileDownloadMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    file_download: {
      input: FileDownloadMutationInput;
      output: FileDownloadMutationOutput;
    };
  }
}
