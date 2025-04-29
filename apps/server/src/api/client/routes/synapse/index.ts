import { FastifyPluginCallback } from 'fastify';

import { socketHandler } from './socket';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';

export const synapseRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.register(socketHandler);

  done();
};
