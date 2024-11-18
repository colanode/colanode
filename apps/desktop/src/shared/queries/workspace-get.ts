import { Workspace } from '@/shared/types/workspaces';

export type WorkspaceGetQueryInput = {
  type: 'workspace_get';
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    workspace_get: {
      input: WorkspaceGetQueryInput;
      output: Workspace | null;
    };
  }
}
