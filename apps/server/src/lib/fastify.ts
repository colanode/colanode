import { FastifyRequest } from 'fastify';

import { config } from './config';

export const generateUrl = (request: FastifyRequest, path: string) => {
  const port =
    request.port && request.port != 80 && request.port != 443
      ? `:${request.port}`
      : '';

  const prefix = config.server.pathPrefix ? `/${config.server.pathPrefix}` : '';

  return `${request.protocol}://${request.hostname}${port}${prefix}${path}`;
};
