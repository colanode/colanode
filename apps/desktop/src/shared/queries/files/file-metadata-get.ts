import { FileMetadata } from '@/shared/types/files';

export type FileMetadataGetQueryInput = {
  type: 'file_metadata_get';
  path: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_metadata_get: {
      input: FileMetadataGetQueryInput;
      output: FileMetadata | null;
    };
  }
}
