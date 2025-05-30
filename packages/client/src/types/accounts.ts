export type Account = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  token: string;
  deviceId: string;
  server: string;
  createdAt: string;
  updatedAt: string | null;
  syncedAt: string | null;
};

export type AccountWorkspaceMetadata = {
  key: 'workspace';
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AccountMetadata = AccountWorkspaceMetadata;

export type AccountMetadataKey = AccountMetadata['key'];

export type AccountMetadataMap = {
  workspace: AccountWorkspaceMetadata;
};
