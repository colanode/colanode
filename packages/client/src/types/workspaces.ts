import { WorkspaceRole, WorkspaceStatus } from '@colanode/core';

export type Workspace = {
  userId: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  accountId: string;
  role: WorkspaceRole;
  maxFileSize?: string | null;
  status: WorkspaceStatus;
};

export type SidebarMenuType = 'chats' | 'spaces' | 'settings';

export type LocalSyncIdentityDrift = {
  localWorkspaceId: string;
  localUserId: string;
  manifestWorkspaceId: string;
  manifestUserId: string;
  manifestCreatedByDeviceId: string;
};

export type LocalSyncExportSummary = {
  nodeUpdates: number;
  documentUpdates: number;
  reactions: number;
  deletes: number;
  files: number;
};

// importRemote replays the op-log only; file blobs are downloaded lazily by
// FileService on demand, so an import summary cannot meaningfully carry a
// `files` count.
export type LocalSyncImportSummary = {
  nodeUpdates: number;
  documentUpdates: number;
  reactions: number;
  deletes: number;
};

export type LocalSyncStatus = {
  enabled: boolean;
  deviceId: string;
  storageDescription: string;
  isRunning: boolean;
  paused: boolean;
  lastExportAt: string | null;
  lastExportError: string | null;
  lastExportSummary: LocalSyncExportSummary | null;
  lastImportAt: string | null;
  lastImportError: string | null;
  lastImportSummary: LocalSyncImportSummary | null;
  identityDrift: LocalSyncIdentityDrift | null;
};
