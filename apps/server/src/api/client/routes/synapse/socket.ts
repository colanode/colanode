import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';
import { socketService } from '@/services/socket-service';

export const socketHandler: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.get('/', { websocket: true }, (socket, request) => {
    socketService.addConnection(request.account, socket);
  });

  done();
};
