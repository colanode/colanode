import { WorkspaceMetadata } from '@colanode/client/types/workspaces';

export type WorkspaceMetadataListQueryInput = {
  type: 'workspace_metadata_list';
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    workspace_metadata_list: {
      input: WorkspaceMetadataListQueryInput;
      output: WorkspaceMetadata[];
    };
  }
}
