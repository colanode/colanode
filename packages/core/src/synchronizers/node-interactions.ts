export type SyncNodeInteractionsInput = {
  type: 'node.interactions';
  rootId: string;
};

export type SyncNodeInteractionData = {
  nodeId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    'node.interactions': {
      input: SyncNodeInteractionsInput;
      data: SyncNodeInteractionData;
    };
  }
}
