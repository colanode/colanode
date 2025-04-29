import { ApiErrorCode } from '@colanode/core';
import { FastifyPluginCallback } from 'fastify';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

interface WorkspaceParams {
  workspaceId: string;
}

export const workspaceDeleteRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.delete<{ Params: WorkspaceParams }>('/', async (request, reply) => {
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
  });

  done();
};
