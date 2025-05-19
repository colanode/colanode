import { app } from 'electron';

import { AppBuild } from '@colanode/client/services';
import { AppPlatform } from '@colanode/client/types';

export const appBuild: AppBuild = {
  type: 'desktop',
  platform: process.platform as AppPlatform,
  version: app.getVersion(),
  sha: app.getVersion(),
};
