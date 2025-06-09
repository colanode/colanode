export type AppType = 'desktop' | 'web';

export type WindowSize = {
  width: number;
  height: number;
  fullscreen: boolean;
};

export type AppPlatformMetadata = {
  key: 'platform';
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AppVersionMetadata = {
  key: 'version';
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AppWindowSizeMetadata = {
  key: 'window.size';
  value: WindowSize;
  createdAt: string;
  updatedAt: string | null;
};

export type AppAccountMetadata = {
  key: 'account';
  value: string;
  createdAt: string;
  updatedAt: string | null;
};

export type AppMetadata =
  | AppPlatformMetadata
  | AppVersionMetadata
  | AppWindowSizeMetadata
  | AppAccountMetadata;

export type AppMetadataKey = AppMetadata['key'];

export type AppMetadataMap = {
  platform: AppPlatformMetadata;
  version: AppVersionMetadata;
  'window.size': AppWindowSizeMetadata;
  account: AppAccountMetadata;
};
