import { WorkspaceMetadata } from '@colanode/client/types/workspaces';

export type WorkspaceMetadataListQueryInput = {
  type: 'workspace.metadata.list';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.metadata.list': {
      input: WorkspaceMetadataListQueryInput;
      output: WorkspaceMetadata[];
    };
  }
}
