import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  ApiErrorCode,
  apiErrorOutputSchema,
  workspaceOutputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { jobService } from '@/services/job-service';

export const workspaceDeleteRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'DELETE',
    url: '/',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: workspaceOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;

      if (request.user.role !== 'owner') {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceDeleteNotAllowed,
          message:
            'You are not allowed to delete this workspace. Only owners can delete workspaces.',
        });
      }

      const workspace = await database
        .deleteFrom('workspaces')
        .returningAll()
        .where('id', '=', workspaceId)
        .executeTakeFirst();

      await jobService.addJob(
        {
          type: 'clean_workspace_data',
          workspaceId: workspaceId,
        },
        {
          jobId: `clean_workspace_data_${workspaceId}`,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          delay: 1000,
        }
      );

      if (!workspace) {
        return reply.code(404).send({
          code: ApiErrorCode.WorkspaceNotFound,
          message: 'Workspace not found.',
        });
      }

      eventBus.publish({
        type: 'workspace_deleted',
        workspaceId: workspaceId,
      });

      return {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        user: {
          id: request.user.id,
          accountId: request.user.account_id,
          role: request.user.role,
          storageLimit: request.user.storage_limit,
          maxFileSize: request.user.max_file_size,
        },
      };
    },
  });

  done();
};
