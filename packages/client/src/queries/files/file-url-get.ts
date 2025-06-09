export type FileUrlGetQueryInput = {
  type: 'file.url.get';
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
    'file.url.get': {
      input: FileUrlGetQueryInput;
      output: FileUrlGetQueryOutput;
    };
  }
}
