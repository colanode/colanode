import { FastifyPluginCallback } from 'fastify';

import { accountRoutes } from '@colanode/server/api/client/routes/accounts';
import { avatarRoutes } from '@colanode/server/api/client/routes/avatars';
import { workspaceRoutes } from '@colanode/server/api/client/routes/workspaces';
import { socketRoutes } from '@colanode/server/api/client/routes/sockets';

export const clientRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(socketRoutes, { prefix: '/sockets' });
  instance.register(accountRoutes, { prefix: '/accounts' });
  instance.register(avatarRoutes, { prefix: '/avatars' });
  instance.register(workspaceRoutes, { prefix: '/workspaces' });

  done();
};
