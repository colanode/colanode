import { WorkspaceCreateInput, ApiErrorCode } from '@colanode/core';
import { FastifyPluginCallback } from 'fastify';

import { database } from '@/data/database';
import { createWorkspace } from '@/lib/workspaces';

export const workspaceCreateRoute: FastifyPluginCallback = (
  instance,
  _,
  done
) => {
  instance.post<{ Body: WorkspaceCreateInput }>('/', async (request, reply) => {
    const input = request.body;

    if (!input.name) {
      return reply.code(400).send({
        code: ApiErrorCode.WorkspaceNameRequired,
        message: 'Workspace name is required.',
      });
    }

    const account = await database
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', request.account.id)
      .executeTakeFirst();

    if (!account) {
      return reply.code(400).send({
        code: ApiErrorCode.AccountNotFound,
        message: 'Account not found.',
      });
    }

    const output = await createWorkspace(account, input);
    return output;
  });

  done();
};
