export type BlobUrlGetQueryInput = {
  type: 'blob.url.get';
  path: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'blob.url.get': {
      input: BlobUrlGetQueryInput;
      output: string | null;
    };
  }
}
