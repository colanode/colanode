import { FastifyPluginCallback } from 'fastify';

import { config } from '@colanode/server/lib/config';
import { generateUrl } from '@colanode/server/lib/fastify';
import { homeTemplate } from '@colanode/server/templates';

export const homeRoute: FastifyPluginCallback = (instance, _, done) => {
  instance.route({
    method: 'GET',
    url: '/',
    handler: async (request, reply) => {
      const configUrl = generateUrl(request, '/config');

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
