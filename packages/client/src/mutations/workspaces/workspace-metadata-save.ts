import {
  WorkspaceMetadataMap,
  WorkspaceMetadataKey,
} from '@colanode/client/types/workspaces';

export type WorkspaceMetadataSaveMutationInput = {
  type: 'workspace_metadata_save';
  accountId: string;
  workspaceId: string;
  key: WorkspaceMetadataKey;
  value: WorkspaceMetadataMap[WorkspaceMetadataKey]['value'];
};

export type WorkspaceMetadataSaveMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    workspace_metadata_save: {
      input: WorkspaceMetadataSaveMutationInput;
      output: WorkspaceMetadataSaveMutationOutput;
    };
  }
}
