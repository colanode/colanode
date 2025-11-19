import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  WorkspaceStorageGetOutput,
  workspaceStorageGetOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';

const buildCounterKeys = (id: string) => [
  `${id}.uploads.size`,
  `${id}.uploads.count`,
  `${id}.nodes.size`,
  `${id}.nodes.count`,
  `${id}.documents.size`,
  `${id}.documents.count`,
];

const buildUsage = (id: string, counters: Record<string, string>) => ({
  uploads: {
    size: counters[`${id}.uploads.size`] ?? '0',
    count: counters[`${id}.uploads.count`] ?? '0',
  },
  nodes: {
    size: counters[`${id}.nodes.size`] ?? '0',
    count: counters[`${id}.nodes.count`] ?? '0',
  },
  documents: {
    size: counters[`${id}.documents.size`] ?? '0',
    count: counters[`${id}.documents.count`] ?? '0',
  },
});

const fetchCounterMap = async (keys: string[]) => {
  if (keys.length === 0) {
    return {};
  }

  const counters = await database
    .selectFrom('counters')
    .select(['key', 'value'])
    .where('key', 'in', keys)
    .execute();

  return counters.reduce<Record<string, string>>((acc, counter) => {
    acc[counter.key] = counter.value ?? '0';
    return acc;
  }, {});
};

export const workspaceStorageGetRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'GET',
    url: '/',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: workspaceStorageGetOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const user = request.user;
      const isWorkspaceAdmin = user.role === 'owner' || user.role === 'admin';

      const workspace = await database
        .selectFrom('workspaces')
        .select(['id', 'storage_limit', 'max_file_size'])
        .where('id', '=', workspaceId)
        .executeTakeFirstOrThrow();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      const userCounterKeys = buildCounterKeys(user.id);
      const [userCounterMap, workspaceCounterMap] = await Promise.all([
        fetchCounterMap(userCounterKeys),
        isWorkspaceAdmin
          ? fetchCounterMap(buildCounterKeys(workspaceId))
          : Promise.resolve<Record<string, string>>({}),
      ]);

      const output: WorkspaceStorageGetOutput = {
        user: {
          id: user.id,
          storageLimit: user.storage_limit,
          maxFileSize: user.max_file_size,
          usage: buildUsage(user.id, userCounterMap),
        },
      };

      if (isWorkspaceAdmin) {
        output.workspace = {
          storageLimit: workspace.storage_limit,
          maxFileSize: workspace.max_file_size,
          usage: buildUsage(workspaceId, workspaceCounterMap),
        };
      }

      return output;
    },
  });

  done();
};
