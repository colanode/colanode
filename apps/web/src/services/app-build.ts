import { AppBuild } from '@colanode/client/services';

const VERSION = '#';
const SHA = '#';

export const appBuild: AppBuild = {
  type: 'web',
  platform: navigator.userAgent,
  version: VERSION,
  sha: SHA,
};
