import { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { ApiErrorCode, UserStatus } from '@colanode/core';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';

declare module 'fastify' {
  interface FastifyRequest {
    user: SelectUser;
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

    request.user = user;
  });

  done();
};

export const workspaceAuthenticator = fp(workspaceAuthenticatorCallback);
