import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceUsersInviteMutationInput,
  WorkspaceUsersInviteMutationOutput,
} from '@/shared/mutations/workspace-users-invite';
import { MutationHandler } from '@/main/types';
import { WorkspaceUsersInviteOutput } from '@colanode/core';

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
      return {
        success: false,
      };
    }

    const account = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', workspace.account_id)
      .executeTakeFirst();

    if (!account) {
      return {
        success: false,
      };
    }

    const server = await databaseService.appDatabase
      .selectFrom('servers')
      .selectAll()
      .where('domain', '=', account.server)
      .executeTakeFirst();

    if (!server) {
      return {
        success: false,
      };
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
