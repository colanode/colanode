import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { ApiErrorCode } from '@colanode/core';

import { isAuthIpRateLimited } from '@/lib/rate-limits';

const authIpRateLimiterCallback: FastifyPluginCallback = (fastify, _, done) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const ip = request.client.ip;
    const isIpRateLimited = await isAuthIpRateLimited(ip);

    if (isIpRateLimited) {
      return reply.code(429).send({
        code: ApiErrorCode.TooManyRequests,
        message: 'Too many authentication attempts. Please try again later.',
      });
    }
  });

  done();
};

export const authIpRateLimiter = fp(authIpRateLimiterCallback);
