import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';

import { avatarDownloadRoute } from './avatar-download';
import { avatarUploadRoute } from './avatar-upload';

export const avatarRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.register(avatarUploadRoute);
  instance.register(avatarDownloadRoute);

  done();
};
