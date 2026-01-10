import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { build, ServerConfig, serverConfigSchema } from '@colanode/core';
import { config } from '@colanode/server/lib/config';

export const configGetRoute: FastifyPluginCallbackZod = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/config',
    schema: {
      response: {
        200: serverConfigSchema,
      },
    },
    handler: async (request) => {
      const output: ServerConfig = {
        name: config.name,
        avatar: config.avatar ?? '',
        version: build.version,
        sha: build.sha,
        ip: request.client.ip,
        pathPrefix: config.pathPrefix,
        account: {
          google: config.account.google.enabled
            ? {
                enabled: config.account.google.enabled,
                clientId: config.account.google.clientId,
              }
            : {
                enabled: false,
              },
        },
      };

      return output;
    },
  });

  done();
};
