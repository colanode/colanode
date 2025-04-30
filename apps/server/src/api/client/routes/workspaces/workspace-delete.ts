import { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ApiErrorCode, apiErrorOutputSchema } from '@colanode/core';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

export const workspaceDeleteRoute: FastifyPluginCallbackZod = (
  instance,
  _,
  done
) => {
  instance.route({
    method: 'DELETE',
    url: '/:workspaceId',
    schema: {
      params: z.object({
        workspaceId: z.string(),
      }),
      response: {
        200: z.object({ id: z.string() }),
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

      await database
        .deleteFrom('workspaces')
        .where('id', '=', workspaceId)
        .execute();

      eventBus.publish({
        type: 'workspace_deleted',
        workspaceId: workspaceId,
      });

      return {
        id: workspaceId,
      };
    },
  });

  done();
};
