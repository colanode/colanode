export type FileUrlGetQueryInput = {
  type: 'file_url_get';
  id: string;
  extension: string;
  accountId: string;
  workspaceId: string;
};

export type FileUrlGetQueryOutput = {
  url: string | null;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    file_url_get: {
      input: FileUrlGetQueryInput;
      output: FileUrlGetQueryOutput;
    };
  }
}
