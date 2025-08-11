import { Download } from '@colanode/client/types/files';

export type DownloadListManualQueryInput = {
  type: 'download.list.manual';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'download.list.manual': {
      input: DownloadListManualQueryInput;
      output: Download[];
    };
  }
}
