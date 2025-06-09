import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  accountUpdateInputSchema,
  AccountUpdateOutput,
  accountUpdateOutputSchema,
  ApiErrorCode,
  apiErrorOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { eventBus } from '@colanode/server/lib/event-bus';

export const accountUpdateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PATCH',
    url: '/',
    schema: {
      body: accountUpdateInputSchema,
      response: {
        200: accountUpdateOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const input = request.body;

      const account = await database
        .selectFrom('accounts')
        .where('id', '=', request.account.id)
        .selectAll()
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found or has been deleted.',
        });
      }

      const nameChanged = account.name !== input.name;
      const avatarChanged = account.avatar !== input.avatar;

      if (!nameChanged && !avatarChanged) {
        const output: AccountUpdateOutput = {
          id: account.id,
          name: input.name,
          avatar: input.avatar,
        };

        return output;
      }

      const { updatedAccount, updatedUsers } = await database
        .transaction()
        .execute(async (tx) => {
          const updatedAccount = await tx
            .updateTable('accounts')
            .returningAll()
            .set({
              name: input.name,
              avatar: input.avatar,
              updated_at: new Date(),
            })
            .where('id', '=', account.id)
            .executeTakeFirst();

          if (!updatedAccount) {
            throw new Error('Account not found or has been deleted.');
          }

          const updatedUsers = await tx
            .updateTable('users')
            .returningAll()
            .set({
              name: input.name,
              avatar: input.avatar,
              updated_at: new Date(),
              updated_by: account.id,
            })
            .where('account_id', '=', account.id)
            .execute();

          return { updatedAccount, updatedUsers };
        });

      if (!updatedAccount) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found or has been deleted.',
        });
      }

      eventBus.publish({
        type: 'account.updated',
        accountId: account.id,
      });

      if (updatedUsers.length > 0) {
        for (const user of updatedUsers) {
          eventBus.publish({
            type: 'user.updated',
            userId: user.id,
            accountId: account.id,
            workspaceId: user.workspace_id,
          });
        }
      }

      const output: AccountUpdateOutput = {
        id: account.id,
        name: input.name,
        avatar: input.avatar,
      };

      return output;
    },
  });

  done();
};
