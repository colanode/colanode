import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';

import { accountSyncRoute } from './account-sync';
import { accountUpdateRoute } from './account-update';

export const accountRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register((subInstance) => {
    subInstance.register(accountAuthenticator);

    subInstance.register(accountSyncRoute);
    subInstance.register(accountUpdateRoute);
  });

  done();
};
