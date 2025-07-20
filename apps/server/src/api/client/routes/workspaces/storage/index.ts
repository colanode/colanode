import { FastifyPluginCallback } from 'fastify';

import { workspaceStorageGetRoute } from './workspace-storage-get';

export const storageRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(workspaceStorageGetRoute);

  done();
};
