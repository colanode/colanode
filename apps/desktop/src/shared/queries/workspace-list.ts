import { Workspace } from '@/shared/types/workspaces';

export type WorkspaceListQueryInput = {
  type: 'workspace_list';
  accountId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    workspace_list: {
      input: WorkspaceListQueryInput;
      output: Workspace[];
    };
  }
}
