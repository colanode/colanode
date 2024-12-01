import { WorkspaceOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceCreateMutationInput,
  WorkspaceCreateMutationOutput,
} from '@/shared/mutations/workspace-create';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
  async handleMutation(
    input: WorkspaceCreateMutationInput
  ): Promise<WorkspaceCreateMutationOutput> {
    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!account) {
      throw new Error('Account not found!');
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new Error('Account not found');
    }

    const { data } = await httpClient.post<WorkspaceOutput>(
      `/v1/workspaces`,
      {
        name: input.name,
        description: input.description,
        avatar: input.avatar,
      },
      {
        domain: server.domain,
        token: account.token,
      }
    );

    const createdWorkspace = await databaseService.appDatabase
      .insertInto('workspaces')
      .returningAll()
      .values({
        workspace_id: data.id ?? data.id,
        account_id: data.user.accountId,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        role: data.user.role,
        user_id: data.user.id,
        version_id: data.versionId,
      })
      .onConflict((cb) => cb.doNothing())
      .executeTakeFirst();

    if (!createdWorkspace) {
      throw new Error('Failed to create workspace!');
    }

    eventBus.publish({
      type: 'workspace_created',
      workspace: {
        id: createdWorkspace.workspace_id,
        userId: createdWorkspace.user_id,
        name: createdWorkspace.name,
        versionId: createdWorkspace.version_id,
        accountId: createdWorkspace.account_id,
        role: createdWorkspace.role,
        avatar: createdWorkspace.avatar,
        description: createdWorkspace.description,
      },
    });

    return {
      id: createdWorkspace.workspace_id,
      userId: createdWorkspace.user_id,
    };
  }
}
