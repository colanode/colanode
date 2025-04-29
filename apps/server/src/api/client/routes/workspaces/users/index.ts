import { FastifyPluginCallback } from 'fastify';

import { userCreateRoute } from './user-create';
import { userRoleUpdateRoute } from './user-role-update';

export const userRoutes: FastifyPluginCallback = (instance, _, done) => {
  instance.register(userCreateRoute);
  instance.register(userRoleUpdateRoute);

  done();
};
