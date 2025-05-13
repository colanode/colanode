import { AppPlatform } from '../types/apps';

export interface AppBuild {
  version: string;
  sha: string;
  type: 'desktop' | 'web';
  platform: AppPlatform;
}
