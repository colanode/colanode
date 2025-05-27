import { FastifyPluginCallback } from 'fastify';

import { socketInitHandler } from './socket-init';
import { socketOpenHandler } from './socket-open';

export const socketRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(socketInitHandler);
  instance.register(socketOpenHandler);

  done();
};
