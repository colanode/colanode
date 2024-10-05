import { LocalNode } from '@/types/nodes';

export type WorkspaceUserListQueryInput = {
  type: 'workspace_user_list';
  userId: string;
  page: number;
  count: number;
};

declare module '@/operations/queries' {
  interface QueryMap {
    workspace_user_list: {
      input: WorkspaceUserListQueryInput;
      output: LocalNode[];
    };
  }
}