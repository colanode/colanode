import { Upload } from '@colanode/client/types/files';

export type UploadListQueryInput = {
  type: 'upload.list';
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'upload.list': {
      input: UploadListQueryInput;
      output: Upload[];
    };
  }
}
