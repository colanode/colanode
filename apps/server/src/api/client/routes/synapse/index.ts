import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';

import { socketHandler } from './socket';

export const synapseRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.register(socketHandler);

  done();
};
