import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import {
  AccountSyncOutput,
  WorkspaceOutput,
  WorkspaceRole,
  ApiErrorCode,
  UserStatus,
  accountSyncOutputSchema,
  apiErrorOutputSchema,
  accountSyncInputSchema,
} from '@colanode/core';

import { database } from '@/data/database';

export const accountSyncRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'POST',
    url: '/sync',
    schema: {
      body: accountSyncInputSchema,
      response: {
        200: accountSyncOutputSchema,
        400: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
        401: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const account = await database
        .selectFrom('accounts')
        .where('id', '=', request.account.id)
        .selectAll()
        .executeTakeFirst();

      if (!account) {
        return reply.code(404).send({
          code: ApiErrorCode.AccountNotFound,
          message: 'Account not found. Check your token.',
        });
      }

      const device = await database
        .selectFrom('devices')
        .selectAll()
        .where('id', '=', request.account.deviceId)
        .executeTakeFirst();

      if (!device) {
        return reply.code(404).send({
          code: ApiErrorCode.DeviceNotFound,
          message: 'Device not found. Check your token.',
        });
      }

      const input = request.body;
      await database
        .updateTable('devices')
        .set({
          synced_at: new Date(),
          ip: request.client.ip,
          platform: input.platform || request.client.platform,
          version: input.version || request.client.version,
        })
        .where('id', '=', device.id)
        .execute();

      const workspaceOutputs: WorkspaceOutput[] = [];
      const users = await database
        .selectFrom('users')
        .where('account_id', '=', account.id)
        .where('status', '=', UserStatus.Active)
        .where('role', '!=', 'none')
        .selectAll()
        .execute();

      if (users.length > 0) {
        const workspaceIds = users.map((u) => u.workspace_id);
        const workspaces = await database
          .selectFrom('workspaces')
          .where('id', 'in', workspaceIds)
          .selectAll()
          .execute();

        for (const user of users) {
          const workspace = workspaces.find((w) => w.id === user.workspace_id);

          if (!workspace) {
            continue;
          }

          workspaceOutputs.push({
            id: workspace.id,
            name: workspace.name,
            avatar: workspace.avatar,
            description: workspace.description,
            user: {
              id: user.id,
              accountId: user.account_id,
              role: user.role as WorkspaceRole,
              storageLimit: user.storage_limit,
              maxFileSize: user.max_file_size,
            },
          });
        }
      }

      const output: AccountSyncOutput = {
        account: {
          id: account.id,
          name: account.name,
          email: account.email,
          avatar: account.avatar,
        },
        workspaces: workspaceOutputs,
      };

      return output;
    },
  });

  done();
};
