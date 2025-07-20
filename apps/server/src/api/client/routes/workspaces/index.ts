import { FastifyPluginCallback } from 'fastify';

import { accountAuthenticator } from '@colanode/server/api/client/plugins/account-auth';
import { workspaceAuthenticator } from '@colanode/server/api/client/plugins/workspace-auth';

import { fileRoutes } from './files';
import { mutationsRoutes } from './mutations';
import { storageRoutes } from './storage';
import { userRoutes } from './users';
import { workspaceCreateRoute } from './workspace-create';
import { workspaceDeleteRoute } from './workspace-delete';
import { workspaceGetRoute } from './workspace-get';
import { workspaceUpdateRoute } from './workspace-update';

export const workspaceRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(accountAuthenticator);

  instance.register(workspaceCreateRoute);

  instance.register(
    (subInstance) => {
      subInstance.register(workspaceAuthenticator);

      subInstance.register(workspaceDeleteRoute);
      subInstance.register(workspaceGetRoute);
      subInstance.register(workspaceUpdateRoute);

      subInstance.register(fileRoutes, { prefix: '/files' });
      subInstance.register(userRoutes, { prefix: '/users' });
      subInstance.register(mutationsRoutes, { prefix: '/mutations' });
      subInstance.register(storageRoutes, { prefix: '/storage' });
    },
    {
      prefix: '/:workspaceId',
    }
  );

  done();
};
