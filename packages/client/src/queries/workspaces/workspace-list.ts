import { Workspace } from '../../types/workspaces';

export type WorkspaceListQueryInput = {
  type: 'workspace_list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    workspace_list: {
      input: WorkspaceListQueryInput;
      output: Workspace[];
    };
  }
}
