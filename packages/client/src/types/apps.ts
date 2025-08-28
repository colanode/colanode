import { ThemeColor, ThemeMode } from '@colanode/client/types';

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

export type AppThemeModeMetadata = {
  key: 'theme.mode';
  value: ThemeMode;
  createdAt: string;
  updatedAt: string | null;
};

export type AppThemeColorMetadata = {
  key: 'theme.color';
  value: ThemeColor;
  createdAt: string;
  updatedAt: string | null;
};

export type AppMetadata =
  | AppPlatformMetadata
  | AppVersionMetadata
  | AppWindowSizeMetadata
  | AppAccountMetadata
  | AppThemeModeMetadata
  | AppThemeColorMetadata;

export type AppMetadataKey = AppMetadata['key'];

export type AppMetadataMap = {
  platform: AppPlatformMetadata;
  version: AppVersionMetadata;
  'window.size': AppWindowSizeMetadata;
  account: AppAccountMetadata;
  'theme.mode': AppThemeModeMetadata;
  'theme.color': AppThemeColorMetadata;
};
