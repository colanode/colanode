import { Download, DownloadType } from '@colanode/client/types/files';

export type DownloadGetLastQueryInput = {
  type: 'download.get.last';
  accountId: string;
  workspaceId: string;
  fileId: string;
  downloadType?: DownloadType;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'download.get.last': {
      input: DownloadGetLastQueryInput;
      output: Download | null;
    };
  }
}
