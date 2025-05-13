import { Workspace } from '../../types/workspaces';

export type WorkspaceGetQueryInput = {
  type: 'workspace_get';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    workspace_get: {
      input: WorkspaceGetQueryInput;
      output: Workspace | null;
    };
  }
}
