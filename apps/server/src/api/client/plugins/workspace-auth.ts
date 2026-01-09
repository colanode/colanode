import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';

import {
  ApiErrorCode,
  UserStatus,
  WorkspaceRole,
  WorkspaceStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { WorkspaceContext } from '@colanode/server/types/api';

declare module 'fastify' {
  interface FastifyRequest {
    workspace: WorkspaceContext;
  }
}

interface WorkspaceParams {
  workspaceId: string;
}

const workspaceAuthenticatorCallback: FastifyPluginCallback = (
  fastify,
  _,
  done
) => {
  if (!fastify.hasRequestDecorator('user')) {
    fastify.decorateRequest('user');
  }

  fastify.addHook('onRequest', async (request, reply) => {
    const workspaceId = (request.params as WorkspaceParams).workspaceId;

    if (!workspaceId) {
      return reply.code(400).send({
        code: ApiErrorCode.WorkspaceNoAccess,
        message: 'Workspace ID is required',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .innerJoin('users', 'workspaces.id', 'users.workspace_id')
      .select([
        'workspaces.id as workspace_id',
        'workspaces.max_file_size as max_file_size',
        'workspaces.status as status',
        'users.id as user_id',
        'users.role as user_role',
        'users.status as user_status',
      ])
      .where('workspaces.id', '=', workspaceId)
      .where('users.account_id', '=', request.account.id)
      .executeTakeFirst();

    if (
      !workspace ||
      workspace.status !== WorkspaceStatus.Active ||
      workspace.user_role === 'none' ||
      workspace.user_status !== UserStatus.Active
    ) {
      return reply.code(403).send({
        code: ApiErrorCode.WorkspaceNoAccess,
        message: 'You do not have access to this workspace.',
      });
    }

    const context: WorkspaceContext = {
      id: workspace.workspace_id,
      maxFileSize: workspace.max_file_size,
      status: workspace.status,
      user: {
        id: workspace.user_id,
        accountId: request.account.id,
        role: workspace.user_role as WorkspaceRole,
      },
    };

    request.workspace = context;
  });

  done();
};

export const workspaceAuthenticator = fp(workspaceAuthenticatorCallback);
