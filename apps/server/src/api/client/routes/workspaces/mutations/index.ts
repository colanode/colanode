import { FastifyPluginCallback } from 'fastify';

import { mutationsSyncRoute } from './mutations-sync';

export const mutationsRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(mutationsSyncRoute);

  done();
};
