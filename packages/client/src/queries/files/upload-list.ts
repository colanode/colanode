import { Upload } from '@colanode/client/types/files';

export type UploadListQueryInput = {
  type: 'upload.list';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'upload.list': {
      input: UploadListQueryInput;
      output: Upload[];
    };
  }
}
