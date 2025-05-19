import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { socketService } from '@colanode/server/services/socket-service';

export const socketHandler: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.get('/', { websocket: true }, (socket, request) => {
    socketService.addConnection(request.account, socket);
  });

  done();
};
