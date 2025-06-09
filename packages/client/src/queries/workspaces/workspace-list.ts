import { Workspace } from '@colanode/client/types/workspaces';

export type WorkspaceListQueryInput = {
  type: 'workspace.list';
  accountId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.list': {
      input: WorkspaceListQueryInput;
      output: Workspace[];
    };
  }
}
