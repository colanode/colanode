export type FileDownloadRequestGetQueryInput = {
  type: 'file.download.request.get';
  id: string;
  accountId: string;
  workspaceId: string;
};

export type FileDownloadRequestGetQueryOutput = {
  url: string;
  headers: Record<string, string>;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.download.request.get': {
      input: FileDownloadRequestGetQueryInput;
      output: FileDownloadRequestGetQueryOutput | null;
    };
  }
}
