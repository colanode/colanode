import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  workspaceStorageUsersGetOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  after: z.string().optional(),
});

export const usersStorageGetRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/storage',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      querystring: querySchema,
      response: {
        200: workspaceStorageUsersGetOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const { limit, after } = request.query;
      const user = request.user;

      if (user.role !== 'owner' && user.role !== 'admin') {
        return reply.code(403).send({
          code: ApiErrorCode.UserInviteNoAccess,
          message: 'You do not have access to get user storage.',
        });
      }

      let usersQuery = database
        .selectFrom('users')
        .select(['id', 'storage_limit', 'max_file_size'])
        .where('workspace_id', '=', workspaceId);

      if (after) {
        usersQuery = usersQuery.where('id', '>', after);
      }

      const userRows = await usersQuery.orderBy('id').limit(limit).execute();

      const userIds = userRows.map((row) => row.id);

      let counterMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const counterKeys = userIds.flatMap((id) => [
          `${id}.uploads.size`,
          `${id}.uploads.count`,
          `${id}.nodes.size`,
          `${id}.nodes.count`,
          `${id}.documents.size`,
          `${id}.documents.count`,
        ]);

        const counters = await database
          .selectFrom('counters')
          .select(['key', 'value'])
          .where('key', 'in', counterKeys)
          .execute();

        counterMap = counters.reduce<Record<string, string>>((acc, counter) => {
          acc[counter.key] = counter.value ?? '0';
          return acc;
        }, {});
      }

      const getCounterValue = (key: string) => counterMap[key] ?? '0';

      const users = userRows.map((row) => ({
        id: row.id,
        storageLimit: row.storage_limit,
        maxFileSize: row.max_file_size,
        usage: {
          uploads: {
            size: getCounterValue(`${row.id}.uploads.size`),
            count: getCounterValue(`${row.id}.uploads.count`),
          },
          nodes: {
            size: getCounterValue(`${row.id}.nodes.size`),
            count: getCounterValue(`${row.id}.nodes.count`),
          },
          documents: {
            size: getCounterValue(`${row.id}.documents.size`),
            count: getCounterValue(`${row.id}.documents.count`),
          },
        },
      }));

      return {
        users,
      };
    },
  });

  done();
};
