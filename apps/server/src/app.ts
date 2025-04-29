import { createDebugger } from '@colanode/core';
import { fastify } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebsocket from '@fastify/websocket';

import { clientRoutes } from '@/api/client/routes';
import { ipDecorator } from '@/api/client/plugins/ip';

const debug = createDebugger('server:app');

export const initApp = async () => {
  const app = fastify({
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  await app.register(fastifyWebsocket);
  await app.register(ipDecorator);
  await app.register(clientRoutes, { prefix: '/client/v1' });

  app.get('/', (_, reply) => {
    reply.send(
      'This is a Colanode server. For more information, visit https://colanode.com'
    );
  });

  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      debug(`Failed to start server: ${err}`);
      process.exit(1);
    }

    debug(`Server is running at ${address}`);
  });
};
