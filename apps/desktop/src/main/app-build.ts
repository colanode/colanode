import { app } from 'electron';

import { AppBuild } from '@colanode/client/services';

const VERSION = app.getVersion();
const SHA = app.getVersion();

export const appBuild: AppBuild = {
  type: 'desktop',
  platform: process.platform,
  version: VERSION,
  sha: SHA,
};
