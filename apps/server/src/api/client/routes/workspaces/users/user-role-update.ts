import { FastifyPluginCallback } from 'fastify';
import { UserRoleUpdateInput, ApiErrorCode, UserStatus } from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

interface UserRoleUpdateParams {
  userId: string;
}

export const userRoleUpdateRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.patch<{ Params: UserRoleUpdateParams; Body: UserRoleUpdateInput }>(
    '/:userId',
    async (request, reply) => {
      const userId = request.params.userId;
      const input = request.body;
      const user = request.user;

      if (user.role !== 'owner' && user.role !== 'admin') {
        return reply.code(403).send({
          code: ApiErrorCode.UserUpdateNoAccess,
          message: 'You do not have access to update users to this workspace.',
        });
      }

      const userToUpdate = await database
        .selectFrom('users')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirst();

      if (!userToUpdate) {
        return reply.code(404).send({
          code: ApiErrorCode.UserNotFound,
          message: 'User not found.',
        });
      }

      const status =
        input.role === 'none' ? UserStatus.Removed : UserStatus.Active;
      await database
        .updateTable('users')
        .set({
          role: input.role,
          status,
          updated_at: new Date(),
          updated_by: user.id,
        })
        .where('id', '=', userToUpdate.id)
        .execute();

      eventBus.publish({
        type: 'user_updated',
        userId: userToUpdate.id,
        accountId: userToUpdate.account_id,
        workspaceId: userToUpdate.workspace_id,
      });

      return { success: true };
    }
  );

  done();
};
