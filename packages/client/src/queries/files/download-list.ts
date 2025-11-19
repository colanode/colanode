import { Download } from '@colanode/client/types/files';

export type DownloadListQueryInput = {
  type: 'download.list';
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'download.list': {
      input: DownloadListQueryInput;
      output: Download[];
    };
  }
}
