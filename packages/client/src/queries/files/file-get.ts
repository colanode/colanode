import { File } from '@colanode/client/types/files';

export type FileGetQueryInput = {
  type: 'file.get';
  id: string;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.get': {
      input: FileGetQueryInput;
      output: File | null;
    };
  }
}
