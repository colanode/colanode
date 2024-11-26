import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceUserRoleUpdateMutationInput,
  WorkspaceUserRoleUpdateMutationOutput,
} from '@/shared/mutations/workspace-user-role-update';
import { WorkspaceUserRoleUpdateOutput } from '@colanode/core';
import { MutationHandler } from '@/main/types';

export class WorkspaceUserRoleUpdateMutationHandler
  implements MutationHandler<WorkspaceUserRoleUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUserRoleUpdateMutationInput
  ): Promise<WorkspaceUserRoleUpdateMutationOutput> {
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

    await httpClient.put<WorkspaceUserRoleUpdateOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users/${input.userToUpdateId}`,
      {
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
