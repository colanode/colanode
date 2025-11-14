import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { database } from '@colanode/server/data/database';
import { eventBus } from '@colanode/server/lib/event-bus';

export const logoutRoute: FastifyPluginCallbackZod = (instance, _, done) => {
  instance.route({
    method: 'DELETE',
    url: '/logout',
    schema: {
      response: {
        200: z.object({}),
      },
    },
    handler: async (request) => {
      const account = request.account;

      await database
        .deleteFrom('devices')
        .where('id', '=', account.deviceId)
        .execute();

      eventBus.publish({
        type: 'device.deleted',
        accountId: account.id,
        deviceId: account.deviceId,
      });

      return {};
    },
  });

  done();
};
