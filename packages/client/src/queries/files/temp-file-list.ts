import { TempFile } from '@colanode/client/types';

export type TempFileListQueryInput = {
  type: 'temp.file.list';
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'temp.file.list': {
      input: TempFileListQueryInput;
      output: TempFile[];
    };
  }
}
