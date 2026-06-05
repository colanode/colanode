export type SyncNodeTombstonesInput = {
  type: 'node.tombstones';
  rootId: string;
};

export type SyncNodeTombstoneData = {
  id: string;
  rootId: string;
  workspaceId: string;
  deletedBy: string;
  deletedAt: string;
  revision: string;
  // For file nodes only: the file extension at the time of deletion.
  // Allows receiving devices (and the originating device itself) to
  // garbage-collect the corresponding blob in shared storage without
  // needing the original node row to still exist locally.
  fileExtension?: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    'node.tombstones': {
      input: SyncNodeTombstonesInput;
      data: SyncNodeTombstoneData;
    };
  }
}
