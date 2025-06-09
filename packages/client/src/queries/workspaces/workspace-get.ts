import { Workspace } from '@colanode/client/types/workspaces';

export type WorkspaceGetQueryInput = {
  type: 'workspace.get';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.get': {
      input: WorkspaceGetQueryInput;
      output: Workspace | null;
    };
  }
}
