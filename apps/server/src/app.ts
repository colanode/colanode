import fastifyWebsocket from '@fastify/websocket';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { createDebugger } from '@colanode/core';
import { clientDecorator } from '@colanode/server/api/client/plugins/client';
import { corsPlugin } from '@colanode/server/api/client/plugins/cors';
import { errorHandler } from '@colanode/server/api/client/plugins/error-handler';
import { clientRoutes } from '@colanode/server/api/client/routes';

const debug = createDebugger('server:app');

export const initApp = () => {
  const server = fastify({
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  server.register(errorHandler);

  server.setSerializerCompiler(serializerCompiler);
  server.setValidatorCompiler(validatorCompiler);

  server.register(corsPlugin);
  server.register(fastifyWebsocket);
  server.register(clientDecorator);
  server.register(clientRoutes, { prefix: '/client/v1' });

  server.get('/', (_, reply) => {
    reply.send(
      'This is a Colanode server. For more information, visit https://colanode.com'
    );
  });

  server.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      debug(`Failed to start server: ${err}`);
      process.exit(1);
    }

    debug(`Server is running at ${address}`);
  });
};
