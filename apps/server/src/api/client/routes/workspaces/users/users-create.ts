import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  AccountStatus,
  ApiErrorCode,
  apiErrorOutputSchema,
  generateId,
  IdType,
  usersCreateInputSchema,
  UsersCreateOutput,
  usersCreateOutputSchema,
  UserStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectAccount } from '@colanode/server/data/schema';
import { config } from '@colanode/server/lib/config';
import { eventBus } from '@colanode/server/lib/event-bus';
import { getNameFromEmail } from '@colanode/server/lib/utils';

export const usersCreateRoute: FastifyPluginCallbackZod = (
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
      body: usersCreateInputSchema,
      response: {
        200: usersCreateOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const input = request.body;
      const user = request.user;

      if (!input.users || input.users.length === 0) {
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

      const output: UsersCreateOutput = {
        users: [],
        errors: [],
      };

      for (const user of input.users) {
        const account = await getOrCreateAccount(user.email);
        if (!account) {
          output.errors.push({
            email: user.email,
            error: 'Account not found or could not be created.',
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
          output.users.push({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            avatar: existingUser.avatar,
            role: existingUser.role,
            customName: existingUser.custom_name,
            customAvatar: existingUser.custom_avatar,
            createdAt: existingUser.created_at.toISOString(),
            updatedAt: existingUser.updated_at?.toISOString() ?? null,
            revision: existingUser.revision,
            status: existingUser.status,
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
            role: user.role,
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
          output.errors.push({
            email: user.email,
            error: 'User could not be created.',
          });
          continue;
        }

        eventBus.publish({
          type: 'user.created',
          accountId: account.id,
          userId: userId,
          workspaceId: workspaceId,
        });

        output.users.push({
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          avatar: newUser.avatar,
          role: newUser.role,
          customName: newUser.custom_name,
          customAvatar: newUser.custom_avatar,
          createdAt: newUser.created_at.toISOString(),
          updatedAt: newUser.updated_at?.toISOString() ?? null,
          revision: newUser.revision,
          status: newUser.status,
        });
      }

      return output;
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
