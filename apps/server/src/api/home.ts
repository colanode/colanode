import { FastifyPluginCallback } from 'fastify';

import { config } from '@colanode/server/lib/config';
import { homeTemplate } from '@colanode/server/templates';

export const homeRoute: FastifyPluginCallback = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/',
    handler: async (request, reply) => {
      const port =
        request.port && request.port != 80 && request.port != 443
          ? `:${request.port}`
          : '';

      const prefix = config.server.pathPrefix
        ? `/${config.server.pathPrefix}`
        : '';

      const configUrl = `${request.protocol}://${request.hostname}${port}${prefix}/config`;

      const template = homeTemplate({
        name: config.server.name,
        url: configUrl,
        version: config.server.version,
        sha: config.server.sha,
      });

      reply.type('text/html').send(template);
    },
  });

  done();
};
