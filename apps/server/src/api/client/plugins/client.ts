import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface ClientContext {
  ip: string;
  platform?: string;
  version?: string;
  type?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    client: ClientContext;
  }
}

const getHeaderAsString = (
  request: FastifyRequest,
  header: string
): string | undefined => {
  const value = request.headers[header.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

const clientDecoratorCallback: FastifyPluginCallback = (fastify, _, done) => {
  if (!fastify.hasRequestDecorator('client')) {
    fastify.decorateRequest('client');
  }

  fastify.addHook('onRequest', async (request) => {
    const ipValue =
      getHeaderAsString(request, 'cf-connecting-ip') ||
      getHeaderAsString(request, 'x-forwarded-for') ||
      request.ip;

    const ip = ipValue.split(',')[0]!;
    const platform = getHeaderAsString(request, 'x-client-platform');
    const version = getHeaderAsString(request, 'x-client-version');
    const type = getHeaderAsString(request, 'x-client-type');

    request.client = {
      ip,
      platform,
      version,
      type,
    };
  });

  done();
};

export const clientDecorator = fp(clientDecoratorCallback);
