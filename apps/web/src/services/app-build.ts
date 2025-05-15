import { AppBuild } from '@colanode/client/services';
import { AppPlatform } from '@colanode/client/types';

export const appBuild: AppBuild = {
  type: 'web',
  platform: 'web' as AppPlatform,
  version: '1.0.0',
  sha: '1.0.0',
};
