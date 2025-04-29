import { FastifyPluginCallback } from 'fastify';

import { avatarUploadRoute } from './avatar-upload';
import { avatarDownloadRoute } from './avatar-download';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';

export const avatarRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.register(avatarUploadRoute);
  instance.register(avatarDownloadRoute);

  done();
};
