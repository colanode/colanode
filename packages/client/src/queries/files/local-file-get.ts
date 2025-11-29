import { LocalFile } from '@colanode/client/types';

export type LocalFileGetQueryInput = {
  type: 'local.file.get';
  fileId: string;
  userId: string;
  autoDownload?: boolean;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'local.file.get': {
      input: LocalFileGetQueryInput;
      output: LocalFile | null;
    };
  }
}
