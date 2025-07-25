import { Download } from '@colanode/client/types/files';

export type DownloadListQueryInput = {
  type: 'download.list';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'download.list': {
      input: DownloadListQueryInput;
      output: Download[];
    };
  }
}
