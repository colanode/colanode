import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import {
  WorkspaceOutput,
  ApiErrorCode,
  apiErrorOutputSchema,
  workspaceOutputSchema,
  workspaceUpdateInputSchema,
  WorkspaceStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { eventBus } from '@colanode/server/lib/event-bus';

export const workspaceUpdateRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'PATCH',
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
        500: apiErrorOutputSchema,
      },
    },
    handler: async (request, reply) => {
      const workspaceId = request.params.workspaceId;
      const input = request.body;

      if (request.workspace.status === WorkspaceStatus.Readonly) {
        return reply.code(403).send({
          code: ApiErrorCode.WorkspaceReadonly,
          message:
            'Workspace is readonly and you cannot update this workspace.',
        });
      }

      if (request.workspace.user.role !== 'owner') {
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
          updated_by: request.account.id,
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
        type: 'workspace.updated',
        workspaceId: updatedWorkspace.id,
      });

      const output: WorkspaceOutput = {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
        avatar: updatedWorkspace.avatar,
        status: updatedWorkspace.status,
        user: {
          id: request.workspace.user.id,
          accountId: request.workspace.user.accountId,
          role: request.workspace.user.role,
        },
      };

      return output;
    },
  });

  done();
};
