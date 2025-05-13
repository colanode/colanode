import { AppBuild } from '@colanode/client/services';
import { AppPlatform } from '@colanode/client/types';

import { app } from 'electron';

export const appBuild: AppBuild = {
  type: 'desktop',
  platform: process.platform as AppPlatform,
  version: app.getVersion(),
  sha: app.getVersion(),
};
