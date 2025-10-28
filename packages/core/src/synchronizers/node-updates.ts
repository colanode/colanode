import { UpdateMergeMetadata } from '@colanode/core';

export type SyncNodeUpdatesInput = {
  type: 'node.updates';
  rootId: string;
};

export type SyncNodeUpdateData = {
  id: string;
  nodeId: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  data: string;
  createdAt: string;
  createdBy: string;
  mergedUpdates: UpdateMergeMetadata[] | null | undefined;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    'node.updates': {
      input: SyncNodeUpdatesInput;
      data: SyncNodeUpdateData;
    };
  }
}
