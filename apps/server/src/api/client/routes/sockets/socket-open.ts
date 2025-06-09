import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { apiErrorOutputSchema } from '@colanode/core';
import { socketService } from '@colanode/server/services/socket-service';

export const socketOpenHandler: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/:socketId',
    schema: {
      params: z.object({
        socketId: z.string(),
      }),
      response: {
        400: apiErrorOutputSchema,
        500: apiErrorOutputSchema,
      },
    },
    wsHandler: async (connection, request) => {
      const added = await socketService.addConnection(
        request.params.socketId,
        connection
      );

      if (!added) {
        connection.close(401, 'Socket ID is invalid');
      }
    },
    handler: () => {},
  });

  done();
};
