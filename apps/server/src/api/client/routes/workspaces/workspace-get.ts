import {
  WorkspaceRole,
  WorkspaceOutput,
  ApiErrorCode,
  UserStatus,
} from '@colanode/core';
import { FastifyPluginCallback } from 'fastify';

import { database } from '@/data/database';

interface WorkspaceParams {
  workspaceId: string;
}

export const workspaceGetRoute: FastifyPluginCallback = (instance, _, done) => {
  instance.get<{ Params: WorkspaceParams }>('/', async (request, reply) => {
    const workspaceId = request.params.workspaceId;

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return reply.code(400).send({
        code: ApiErrorCode.WorkspaceNotFound,
        message: 'Workspace not found.',
      });
    }

    const user = await database
      .selectFrom('users')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('account_id', '=', request.account.id)
      .executeTakeFirst();

    if (!user || user.status !== UserStatus.Active || user.role === 'none') {
      return reply.code(403).send({
        code: ApiErrorCode.WorkspaceNoAccess,
        message: 'You do not have access to this workspace.',
      });
    }

    const output: WorkspaceOutput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      user: {
        id: user.id,
        accountId: user.account_id,
        role: user.role as WorkspaceRole,
        storageLimit: user.storage_limit,
        maxFileSize: user.max_file_size,
      },
    };

    return output;
  });

  done();
};
