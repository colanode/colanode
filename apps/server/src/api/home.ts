import { FastifyPluginCallback } from 'fastify';

import { build } from '@colanode/core';
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
        name: config.name,
        url: configUrl,
        version: build.version,
        sha: build.sha,
      });

      reply.type('text/html').send(template);
    },
  });

  done();
};
