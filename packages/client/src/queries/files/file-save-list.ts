import { FileSaveState } from '@colanode/client/types/files';

export type FileSaveListQueryInput = {
  type: 'file.save.list';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.save.list': {
      input: FileSaveListQueryInput;
      output: FileSaveState[];
    };
  }
}
