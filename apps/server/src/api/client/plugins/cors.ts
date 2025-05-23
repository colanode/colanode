import cors from '@fastify/cors';
import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

const corsCallback: FastifyPluginCallback = (fastify, _, done) => {
  fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 7200, // Cache preflight requests for 2 hours (in seconds)
  });

  done();
};

export const corsPlugin = fp(corsCallback);
