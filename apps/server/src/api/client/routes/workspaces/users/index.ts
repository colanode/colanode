import { FastifyPluginCallback } from 'fastify';

import { userRoleUpdateRoute } from './user-role-update';
import { userStorageUpdateRoute } from './user-storage-update';
import { usersCreateRoute } from './users-create';

export const userRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(usersCreateRoute);
  instance.register(userRoleUpdateRoute);
  instance.register(userStorageUpdateRoute);

  done();
};
