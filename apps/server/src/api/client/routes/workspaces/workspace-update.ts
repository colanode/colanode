import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  WorkspaceOutput,
  ApiErrorCode,
  apiErrorOutputSchema,
  workspaceOutputSchema,
  workspaceUpdateInputSchema,
} from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const workspaceUpdateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PUT',
    url: '/',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      body: workspaceUpdateInputSchema,
      response: {
        200: workspaceOutputSchema,
        400: apiErrorOutputSchema,
        403: apiErrorOutputSchema,
        404: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const input = request.body;

      if (request.user.role !== 'owner') {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceUpdateNotAllowed,
          message:
            'You are not allowed to update this workspace. Only owners can update workspaces.',
        });
      }

      const updatedWorkspace = await database
        .updateTable('workspaces')
        .set({
          name: input.name,
          description: input.description,
          avatar: input.avatar,
          updated_at: new Date(),
          updated_by: request.user.id,
        })
        .where('id', '=', workspaceId)
        .returningAll()
        .executeTakeFirst();

      if (!updatedWorkspace) {
        return reply.code(500).send({
          code: ApiErrorCode.WorkspaceUpdateFailed,
          message: 'Failed to update workspace.',
        });
      }

      eventBus.publish({
        type: 'workspace_updated',
        workspaceId: updatedWorkspace.id,
      });

      const output: WorkspaceOutput = {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        avatar: updatedWorkspace.avatar,
        user: {
          id: request.user.id,
          accountId: request.user.account_id,
          role: request.user.role,
          storageLimit: request.user.storage_limit,
          maxFileSize: request.user.max_file_size,
        },
      };

      return output;
    },
  });

  done();
};
