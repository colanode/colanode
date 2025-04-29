import { FastifyPluginCallback } from 'fastify';
import { ServerConfig } from '@colanode/core';

import { configuration } from '@/lib/configuration';

export const configGetRoute: FastifyPluginCallback = (fastify, _, done) => {
  fastify.get('/', async (request) => {
    const config: ServerConfig = {
      name: configuration.server.name,
      avatar: configuration.server.avatar,
      version: '0.1.0',
      ip: request.originalIp,
      attributes: {},
    };

    return config;
  });

  done();
};
