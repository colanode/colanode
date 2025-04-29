import { FastifyPluginCallback } from 'fastify';

import { fileRoutes } from './files';
import { downloadRoutes } from './downloads';
import { userRoutes } from './users';
import { mutationsRoutes } from './mutations';
import { workspaceCreateRoute } from './workspace-create';
import { workspaceDeleteRoute } from './workspace-delete';
import { workspaceGetRoute } from './workspace-get';
import { workspaceUpdateRoute } from './workspace-update';

import { accountAuthenticator } from '@/api/client/plugins/account-auth';
import { workspaceAuthenticator } from '@/api/client/plugins/workspace-auth';

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
      subInstance.register(downloadRoutes, { prefix: '/downloads' });
      subInstance.register(userRoutes, { prefix: '/users' });
      subInstance.register(mutationsRoutes, { prefix: '/mutations' });
    },
    {
      prefix: '/:workspaceId',
    }
  );

  done();
};
