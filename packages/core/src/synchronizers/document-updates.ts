import { UpdateMergeMetadata } from '@colanode/core/types/crdt';

export type SyncDocumentUpdatesInput = {
  type: 'document.updates';
  rootId: string;
};

export type SyncDocumentUpdateData = {
  id: string;
  documentId: string;
  data: string;
  revision: string;
  createdBy: string;
  createdAt: string;
  mergedUpdates: UpdateMergeMetadata[] | null | undefined;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    'document.updates': {
      input: SyncDocumentUpdatesInput;
      data: SyncDocumentUpdateData;
    };
  }
}
