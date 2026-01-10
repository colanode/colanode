import cors from '@fastify/cors';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@colanode/server/lib/config';

const corsCallback: FastifyPluginCallback = (fastify, _, done) => {
  fastify.register(cors, {
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    maxAge: config.cors.maxAge,
  });

  done();
};

export const corsPlugin = fp(corsCallback);
