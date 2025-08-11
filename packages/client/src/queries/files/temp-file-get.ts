import { TempFile } from '@colanode/client/types';

export type TempFileGetQueryInput = {
  type: 'temp.file.get';
  id: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'temp.file.get': {
      input: TempFileGetQueryInput;
      output: TempFile | null;
    };
  }
}
