import cors from '@fastify/cors';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@colanode/server/lib/config';

const corsCallback: FastifyPluginCallback = (fastify, _, done) => {
  const origin = config.server.cors.origin.includes(',')
    ? config.server.cors.origin.split(',').map((o) => o.trim())
    : config.server.cors.origin;

  fastify.register(cors, {
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    maxAge: config.server.cors.maxAge,
  });

  done();
};

export const corsPlugin = fp(corsCallback);
