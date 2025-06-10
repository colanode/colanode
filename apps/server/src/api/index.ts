import { FastifyPluginCallback } from 'fastify';

import { clientRoutes } from '@colanode/server/api/client/routes';
import { configGetRoute } from '@colanode/server/api/config';
import { homeRoute } from '@colanode/server/api/home';
import { config } from '@colanode/server/lib/config';

export const apiRoutes: FastifyPluginCallback = (instance, _, done) => {
  const prefix = config.server.pathPrefix ? `/${config.server.pathPrefix}` : '';

  instance.register(homeRoute, { prefix });
  instance.register(configGetRoute, { prefix });
  instance.register(clientRoutes, { prefix: `${prefix}/client/v1` });

  done();
};
