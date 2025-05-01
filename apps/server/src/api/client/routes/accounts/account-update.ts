import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  accountUpdateInputSchema,
  AccountUpdateOutput,
  accountUpdateOutputSchema,
  ApiErrorCode,
  apiErrorOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const accountUpdateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PUT',
    url: '/:accountId',
    schema: {
      params: z.object({
        accountId: z.string(),
      }),
      body: accountUpdateInputSchema,
      response: {
        200: accountUpdateOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const accountId = request.params.accountId;
      const input = request.body;

      if (accountId !== request.account.id) {
        return reply.code(400).send({
          code: ApiErrorCode.AccountMismatch,
          message:
            'The provided account id does not match the account id in the token. Make sure you are using the correct account token.',
        });
      }

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
        type: 'account_updated',
        accountId: account.id,
      });

      if (updatedUsers.length > 0) {
        for (const user of updatedUsers) {
          eventBus.publish({
            type: 'user_updated',
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
