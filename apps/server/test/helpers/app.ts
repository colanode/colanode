import fastifyWebsocket from '@fastify/websocket';
import { fastify, FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { apiRoutes } from '@colanode/server/api';
import { clientDecorator } from '@colanode/server/api/client/plugins/client';
import { corsPlugin } from '@colanode/server/api/client/plugins/cors';
import { errorHandler } from '@colanode/server/api/client/plugins/error-handler';

export const buildTestApp = (): FastifyInstance => {
  const app = fastify();

  app.register(errorHandler);
  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  app.register(corsPlugin);
  app.register(fastifyWebsocket);
  app.register(clientDecorator);
  app.register(apiRoutes);

  return app;
};
