import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { ServerConfig, serverConfigSchema } from '@colanode/core';

import { configuration } from '@/lib/configuration';

export const configGetRoute: FastifyPluginCallbackZod = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: serverConfigSchema,
      },
    },
    handler: async (request) => {
      const config: ServerConfig = {
        name: configuration.server.name,
        avatar: configuration.server.avatar,
        version: configuration.server.version,
        sha: configuration.server.sha,
        ip: request.client.ip,
        attributes: {},
      };

      return config;
    },
  });

  done();
};
