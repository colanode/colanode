import { FastifyPluginCallback } from 'fastify';

import { synapseRoutes } from '@/api/client/routes/synapse';
import { accountRoutes } from '@/api/client/routes/accounts';
import { avatarRoutes } from '@/api/client/routes/avatars';
import { workspaceRoutes } from '@/api/client/routes/workspaces';
import { configGetRoute } from '@/api/client/routes/config';

export const clientRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(synapseRoutes, { prefix: '/synapse' });
  instance.register(configGetRoute, { prefix: '/config' });
  instance.register(accountRoutes, { prefix: '/accounts' });
  instance.register(avatarRoutes, { prefix: '/avatars' });
  instance.register(workspaceRoutes, { prefix: '/workspaces' });

  done();
};
