import cors from '@fastify/cors';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const corsCallback: FastifyPluginCallback = (fastify, _, done) => {
  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  done();
};

export const corsPlugin = fp(corsCallback);
