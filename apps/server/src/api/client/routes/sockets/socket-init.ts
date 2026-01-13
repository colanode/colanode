import { FastifyPluginCallback } from 'fastify';

import { apiErrorOutputSchema, socketInitOutputSchema } from '@colanode/core';
import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { socketService } from '@colanode/server/services/socket-service';

export const socketInitHandler: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  // This endpoint doesn't expect a body, so we remove all content type parsers
  // to prevent Fastify from throwing FST_ERR_CTP_EMPTY_JSON_BODY when browsers
  // send Content-Type: application/json with an empty body
  instance.removeAllContentTypeParsers();
  instance.addContentTypeParser('*', (_req, _payload, done) => {
    done(null, undefined);
  });

  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      response: {
        200: socketInitOutputSchema,
        400: apiErrorOutputSchema,
        500: apiErrorOutputSchema,
      },
    },
    handler: async (request) => {
      const id = await socketService.initSocket(
        request.account,
        request.client
      );

      return {
        id,
      };
    },
  });

  done();
};
