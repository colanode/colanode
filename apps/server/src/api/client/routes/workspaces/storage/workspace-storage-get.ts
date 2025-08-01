import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { sql } from 'kysely';
import { z } from 'zod/v4';

import {
  ApiErrorCode,
  apiErrorOutputSchema,
  compareString,
  extractFileSubtype,
  FileSubtype,
  workspaceStorageGetOutputSchema,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';

interface WorkspaceStorageAggregateRow {
  mime_type: string;
  total_size: string;
}

interface UserStorageRow {
  id: string;
  storage_limit: string;
  max_file_size: string;
  storage_used: string | null;
}

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

      if (user.role !== 'owner' && user.role !== 'admin') {
        return reply.code(403).send({
          code: ApiErrorCode.UserInviteNoAccess,
          message: 'You do not have access to get workspace storage.',
        });
      }

      const workspace = await database
        .selectFrom('workspaces')
        .selectAll()
        .where('id', '=', workspaceId)
        .executeTakeFirstOrThrow();

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      const [subtypeAggregates, usersWithStorage] = await Promise.all([
        sql<WorkspaceStorageAggregateRow>`
          SELECT 
            mime_type,
            SUM(size) as total_size
          FROM uploads
          WHERE workspace_id = ${workspaceId}
          GROUP BY mime_type
        `.execute(database),
        sql<UserStorageRow>`
          SELECT 
            u.id,
            u.storage_limit,
            u.max_file_size,
            COALESCE(c.value, '0') as storage_used
          FROM users u
          LEFT JOIN counters c ON c.key = CONCAT(u.id, '.storage.used')
          WHERE u.workspace_id = ${workspaceId}
        `.execute(database),
      ]);

      const subtypeGroups: Record<string, bigint> = {};
      let totalUsed = 0n;
      for (const row of subtypeAggregates.rows) {
        const subtype = extractFileSubtype(row.mime_type);
        const currentSize = subtypeGroups[subtype] || 0n;
        subtypeGroups[subtype] = currentSize + BigInt(row.total_size);
        totalUsed += BigInt(row.total_size);
      }

      const subtypes = Object.entries(subtypeGroups)
        .sort((a, b) => {
          const aSize = BigInt(a[1]);
          const bSize = BigInt(b[1]);
          return Number(bSize - aSize);
        })
        .map(([subtype, size]) => ({
          subtype: subtype as FileSubtype,
          storageUsed: size.toString(),
        }));

      const users = usersWithStorage.rows
        .sort((a, b) => {
          const aUsed = a.storage_used ? BigInt(a.storage_used) : 0n;
          const bUsed = b.storage_used ? BigInt(b.storage_used) : 0n;
          const diff = Number(aUsed - bUsed);
          if (diff !== 0) {
            return -diff;
          }

          return compareString(a.id, b.id);
        })
        .map((user) => ({
          id: user.id,
          storageUsed: user.storage_used ?? '0',
          storageLimit: user.storage_limit,
          maxFileSize: user.max_file_size,
        }));

      return {
        storageLimit: workspace.storage_limit,
        storageUsed: totalUsed.toString(),
        subtypes: subtypes,
        users: users,
      };
    },
  });

  done();
};
