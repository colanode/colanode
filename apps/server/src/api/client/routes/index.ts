import { FastifyPluginCallback } from 'fastify';

import { accountRoutes } from '@colanode/server/api/client/routes/accounts';
import { avatarRoutes } from '@colanode/server/api/client/routes/avatars';
import { configGetRoute } from '@colanode/server/api/client/routes/config';
import { synapseRoutes } from '@colanode/server/api/client/routes/synapse';
import { workspaceRoutes } from '@colanode/server/api/client/routes/workspaces';

export const clientRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(synapseRoutes, { prefix: '/synapse' });
  instance.register(configGetRoute, { prefix: '/config' });
  instance.register(accountRoutes, { prefix: '/accounts' });
  instance.register(avatarRoutes, { prefix: '/avatars' });
  instance.register(workspaceRoutes, { prefix: '/workspaces' });

  done();
};
