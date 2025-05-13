export type AppPlatform =
  | 'aix'
  | 'darwin'
  | 'freebsd'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32';

export type WindowSize = {
  width: number;
  height: number;
  fullscreen: boolean;
};

export type AppPlatformMetadata = {
  key: 'platform';
  value: AppPlatform;
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
  key: 'window_size';
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
  window_size: AppWindowSizeMetadata;
  account: AppAccountMetadata;
};
