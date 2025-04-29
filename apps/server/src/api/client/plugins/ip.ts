import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    originalIp: string;
  }
}

const ipDecoratorCallback: FastifyPluginCallback = (fastify, _, done) => {
  if (!fastify.hasRequestDecorator('originalIp')) {
    fastify.decorateRequest('originalIp');
  }

  fastify.addHook('onRequest', async (request) => {
    const ipValue =
      request.headers['cf-connecting-ip'] ||
      request.headers['x-forwarded-for'] ||
      request.ip;

    let ip = Array.isArray(ipValue) ? ipValue[0] : ipValue;
    if (ip?.includes(',')) {
      ip = ip.split(',')[0];
    }

    request.originalIp = ip ?? request.ip;
  });

  done();
};

export const ipDecorator = fp(ipDecoratorCallback);
