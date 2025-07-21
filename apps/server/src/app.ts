import fastifyWebsocket from '@fastify/websocket';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { apiRoutes } from '@colanode/server/api';
import { clientDecorator } from '@colanode/server/api/client/plugins/client';
import { corsPlugin } from '@colanode/server/api/client/plugins/cors';
import { errorHandler } from '@colanode/server/api/client/plugins/error-handler';
import { config } from '@colanode/server/lib/config';
import { createLogger } from '@colanode/server/lib/logger';

const logger = createLogger('server:app');

export const initApp = () => {
  const server = fastify({
    bodyLimit: 10 * 1024 * 1024, // 10MB
    trustProxy: true,
  });

  server.register(errorHandler);

  server.setSerializerCompiler(serializerCompiler);
  server.setValidatorCompiler(validatorCompiler);

  server.register(corsPlugin);
  server.register(fastifyWebsocket);
  server.register(clientDecorator);
  server.register(apiRoutes);

  server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      logger.error(err, 'Failed to start server');
      process.exit(1);
    }

    const path = config.server.pathPrefix ? `/${config.server.pathPrefix}` : '';
    logger.info(`Server is running at ${address}${path}`);
  });
};
