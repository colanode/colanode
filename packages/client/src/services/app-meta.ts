import type {
  GitHubProviderConfig,
  LocalProviderConfig,
  S3ProviderConfig,
} from '@colanode/client/services/backup';

export type LocalSyncStorageConfig =
  | S3ProviderConfig
  | LocalProviderConfig
  | GitHubProviderConfig;

export interface LocalSyncConfig {
  // A stable, per-device identifier. Each device writes to its own append-only
  // log prefix so multiple devices never contend on the same object.
  deviceId: string;
  storage: LocalSyncStorageConfig;
}

export interface AppMeta {
  type: 'desktop' | 'web' | 'mobile';
  platform: string;
  localOnly?: boolean;
  // When set (only meaningful in localOnly mode), peer-to-peer sync is enabled
  // through the configured object storage.
  localSync?: LocalSyncConfig;
}
