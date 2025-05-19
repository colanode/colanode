import { FileMetadata } from '@colanode/client/types/files';

export type FileMetadataGetQueryInput = {
  type: 'file_metadata_get';
  path: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    file_metadata_get: {
      input: FileMetadataGetQueryInput;
      output: FileMetadata | null;
    };
  }
}
