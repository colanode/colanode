import { Download } from '@/shared/types/nodes';

export type DownloadGetQueryInput = {
  type: 'download_get';
  nodeId: string;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    download_get: {
      input: DownloadGetQueryInput;
      output: Download | null;
    };
  }
}
