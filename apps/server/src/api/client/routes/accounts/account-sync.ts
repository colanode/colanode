import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import {
  AccountSyncOutput,
  WorkspaceOutput,
  WorkspaceRole,
  ApiErrorCode,
  UserStatus,
  accountSyncOutputSchema,
  apiErrorOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';

export const accountSyncRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  // This endpoint doesn't expect a body, so we remove all content type parsers
  // to prevent Fastify from throwing FST_ERR_CTP_EMPTY_JSON_BODY when browsers
  // send Content-Type: application/json with an empty body
  instance.removeAllContentTypeParsers();
  instance.addContentTypeParser('*', (_req, _payload, done) => {
    done(null, undefined);
  });

  instance.route({
    method: 'POST',
    url: '/sync',
    schema: {
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
        .updateTable('devices')
        .returningAll()
        .set({
          synced_at: new Date(),
          ip: request.client.ip,
          platform: request.client.platform,
          version: request.client.version,
        })
        .where('id', '=', request.account.deviceId)
        .executeTakeFirst();

      if (!device) {
        return reply.code(404).send({
          code: ApiErrorCode.DeviceNotFound,
          message: 'Device not found. Check your token.',
        });
      }

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
            status: workspace.status,
            user: {
              id: user.id,
              accountId: user.account_id,
              role: user.role as WorkspaceRole,
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
