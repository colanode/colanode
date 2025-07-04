import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { ApiHeader } from '@colanode/core';
import { ClientContext, ClientType } from '@colanode/server/types/api';

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
    const platform = getHeaderAsString(request, ApiHeader.ClientPlatform);
    const version = getHeaderAsString(request, ApiHeader.ClientVersion);
    const type = getHeaderAsString(request, ApiHeader.ClientType);

    request.client = {
      ip,
      platform: platform || 'unknown',
      version: version || 'unknown',
      type: (type as ClientType) || 'web',
    };
  });

  done();
};

export const clientDecorator = fp(clientDecoratorCallback);
