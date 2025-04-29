import {
  WorkspaceOutput,
  WorkspaceUpdateInput,
  ApiErrorCode,
} from '@colanode/core';
import { FastifyPluginCallback } from 'fastify';

import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';

interface WorkspaceParams {
  workspaceId: string;
}

export const workspaceUpdateRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.put<{ Params: WorkspaceParams; Body: WorkspaceUpdateInput }>(
    '/',
    async (request, reply) => {
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
    }
  );

  done();
};
