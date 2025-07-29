import { Download } from '@colanode/client/types/files';

export type DownloadManualListQueryInput = {
  type: 'download.manual.list';
  accountId: string;
  workspaceId: string;
  page: number;
  count: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'download.manual.list': {
      input: DownloadManualListQueryInput;
      output: Download[];
    };
  }
}
