import { FileWithState } from '@/shared/types/files';

export type FileListQueryInput = {
  type: 'file_list';
  parentId: string;
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_list: {
      input: FileListQueryInput;
      output: FileWithState[];
    };
  }
}
