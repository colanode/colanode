import { FileType } from '@colanode/core';

export type FileMetadata = {
  path: string;
  mimeType: string;
  extension: string;
  name: string;
  size: number;
  type: FileType;
};
