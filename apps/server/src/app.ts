import fastifyMultipart from '@fastify/multipart';
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

export const initApp = async () => {
  const server = fastify({
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  // register the global error handler in the beginning of the app
  server.register(errorHandler);

  server.setSerializerCompiler(serializerCompiler);
  server.setValidatorCompiler(validatorCompiler);

  await server.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  await server.register(corsPlugin);
  await server.register(fastifyWebsocket);
  await server.register(clientDecorator);
  await server.register(clientRoutes, { prefix: '/client/v1' });

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
