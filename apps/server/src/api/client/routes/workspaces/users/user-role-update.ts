import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ApiErrorCode,
  UserStatus,
  userRoleUpdateInputSchema,
  apiErrorOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const userRoleUpdateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PUT',
    url: '/:userId',
    schema: {
      params: z.object({
        userId: z.string(),
      }),
      body: userRoleUpdateInputSchema,
      response: {
        200: z.object({ success: z.boolean() }),
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
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
    },
  });

  done();
};
