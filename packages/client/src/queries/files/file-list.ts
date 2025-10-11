import { LocalFileNode } from '@colanode/client/types/nodes';

export type FileListQueryInput = {
  type: 'file.list';
  parentId: string;
  page: number;
  count: number;
  userId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.list': {
      input: FileListQueryInput;
      output: LocalFileNode[];
    };
  }
}
