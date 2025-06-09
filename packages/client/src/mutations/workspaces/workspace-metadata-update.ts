import {
  WorkspaceMetadataMap,
  WorkspaceMetadataKey,
} from '@colanode/client/types/workspaces';

export type WorkspaceMetadataUpdateMutationInput = {
  type: 'workspace.metadata.update';
  accountId: string;
  workspaceId: string;
  key: WorkspaceMetadataKey;
  value: WorkspaceMetadataMap[WorkspaceMetadataKey]['value'];
};

export type WorkspaceMetadataUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.metadata.update': {
      input: WorkspaceMetadataUpdateMutationInput;
      output: WorkspaceMetadataUpdateMutationOutput;
    };
  }
}
