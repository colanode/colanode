import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  AccountStatus,
  ApiErrorCode,
  apiErrorOutputSchema,
  generateId,
  IdType,
  UserInviteResult,
  usersInviteInputSchema,
  usersInviteOutputSchema,
  UserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { getNameFromEmail } from '@/lib/utils';
import { SelectAccount } from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { config } from '@/lib/config';

export const userCreateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      body: usersInviteInputSchema,
      response: {
        200: usersInviteOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const input = request.body;
      const user = request.user;

      if (!input.emails || input.emails.length === 0) {
        return reply.code(400).send({
          code: ApiErrorCode.UserEmailRequired,
          message: 'User email is required.',
        });
      }

      if (user.role !== 'owner' && user.role !== 'admin') {
        return reply.code(403).send({
          code: ApiErrorCode.UserInviteNoAccess,
          message: 'You do not have access to invite users to this workspace.',
        });
      }

      const results: UserInviteResult[] = [];
      for (const email of input.emails) {
        const account = await getOrCreateAccount(email);
        if (!account) {
          results.push({
            email: email,
            result: 'error',
          });
          continue;
        }

        const existingUser = await database
          .selectFrom('users')
          .selectAll()
          .where('account_id', '=', account.id)
          .where('workspace_id', '=', workspaceId)
          .executeTakeFirst();

        if (existingUser) {
          results.push({
            email: email,
            result: 'exists',
          });
          continue;
        }

        const userId = generateId(IdType.User);
        const newUser = await database
          .insertInto('users')
          .returningAll()
          .values({
            id: userId,
            account_id: account.id,
            workspace_id: workspaceId,
            role: input.role,
            name: account.name,
            email: account.email,
            avatar: account.avatar,
            storage_limit: config.user.storageLimit,
            max_file_size: config.user.maxFileSize,
            created_at: new Date(),
            created_by: request.account.id,
            status: UserStatus.Active,
          })
          .executeTakeFirst();

        if (!newUser) {
          results.push({
            email: email,
            result: 'error',
          });
          continue;
        }

        eventBus.publish({
          type: 'user_created',
          accountId: account.id,
          userId: userId,
          workspaceId: workspaceId,
        });

        results.push({
          email: email,
          result: 'success',
        });
      }

      return { results };
    },
  });

  done();
};

const getOrCreateAccount = async (
  email: string
): Promise<SelectAccount | undefined> => {
  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  if (account) {
    return account;
  }

  const createdAccount = await database
    .insertInto('accounts')
    .returningAll()
    .values({
      id: generateId(IdType.Account),
      name: getNameFromEmail(email),
      email: email,
      avatar: null,
      attrs: null,
      password: null,
      status: AccountStatus.Pending,
      created_at: new Date(),
      updated_at: null,
    })
    .executeTakeFirst();

  return createdAccount;
};
