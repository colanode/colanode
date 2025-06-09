import { LocalFileNode } from '@colanode/client/types/nodes';

export type FileListQueryInput = {
  type: 'file.list';
  parentId: string;
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'file.list': {
      input: FileListQueryInput;
      output: LocalFileNode[];
    };
  }
}
