import { FileNode } from '@colanode/core';

export type FileListQueryInput = {
  type: 'file_list';
  parentId: string;
  page: number;
  count: number;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_list: {
      input: FileListQueryInput;
      output: FileNode[];
    };
  }
}
