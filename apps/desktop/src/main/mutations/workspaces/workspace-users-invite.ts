import { WorkspaceUsersInviteOutput } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceUsersInviteMutationInput,
  WorkspaceUsersInviteMutationOutput,
} from '@/shared/mutations/workspaces/workspace-users-invite';
import { MutationError } from '@/shared/mutations';

export class WorkspaceUsersInviteMutationHandler
  implements MutationHandler<WorkspaceUsersInviteMutationInput>
{
  async handleMutation(
    input: WorkspaceUsersInviteMutationInput
  ): Promise<WorkspaceUsersInviteMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', input.userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new MutationError('workspace_not_found', 'Workspace not found');
    }

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      throw new MutationError(
        'account_not_found',
        'The account associated with this workspace was not found.'
      );
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      throw new MutationError(
        'server_not_found',
        'The server associated with this account was not found.'
      );
    }

    await httpClient.post<WorkspaceUsersInviteOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users`,
      {
        emails: input.emails,
        role: input.role,
      },
      {
        domain: server.domain,
        token: account.token,
      }
    );

    return {
      success: true,
    };
  }
}
