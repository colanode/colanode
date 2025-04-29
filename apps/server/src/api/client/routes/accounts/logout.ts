import { FastifyPluginCallback } from 'fastify';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const logoutRoute: FastifyPluginCallback = (instance, _, done) => {
  instance.delete('/logout', async (request) => {
    const account = request.account;

    await database
      .deleteFrom('devices')
      .where('id', '=', account.deviceId)
      .execute();

    eventBus.publish({
      type: 'device_deleted',
      accountId: account.id,
      deviceId: account.deviceId,
    });

    return {};
  });

  done();
};
