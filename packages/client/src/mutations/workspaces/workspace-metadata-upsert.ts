import {
  WorkspaceMetadataMap,
  WorkspaceMetadataKey,
} from '@colanode/client/types/workspaces';

export type WorkspaceMetadataUpsertMutationInput = {
  type: 'workspace.metadata.upsert';
  accountId: string;
  workspaceId: string;
  key: WorkspaceMetadataKey;
  value: WorkspaceMetadataMap[WorkspaceMetadataKey]['value'];
};

export type WorkspaceMetadataUpsertMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.metadata.upsert': {
      input: WorkspaceMetadataUpsertMutationInput;
      output: WorkspaceMetadataUpsertMutationOutput;
    };
  }
}
