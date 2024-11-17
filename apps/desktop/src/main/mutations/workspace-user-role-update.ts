import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceUserRoleUpdateMutationInput,
  WorkspaceUserRoleUpdateMutationOutput,
} from '@/shared/mutations/workspace-user-role-update';
import { WorkspaceUserRoleUpdateOutput } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import { toUint8Array } from 'js-base64';
import { eventBus } from '@/shared/lib/event-bus';
import { mapNode } from '@/main/utils';

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

    const { data } = await httpClient.put<WorkspaceUserRoleUpdateOutput>(
      `/v1/workspaces/${workspace.workspace_id}/users/${input.userToUpdateId}`,
      {
        role: input.role,
      },
      {
        domain: server.domain,
        token: account.token,
      }
    );

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const updatedUser = await workspaceDatabase
      .updateTable('nodes')
      .returningAll()
      .set({
        attributes: JSON.stringify(data.user.attributes),
        state: toUint8Array(data.user.state),
        updated_at: data.user.updatedAt,
        updated_by: data.user.updatedBy,
        version_id: data.user.versionId,
        server_updated_at: data.user.updatedAt,
        server_version_id: data.user.versionId,
      })
      .where('id', '=', data.user.id)
      .executeTakeFirst();

    if (!updatedUser) {
      return {
        success: false,
      };
    }

    await eventBus.publish({
      type: 'node_updated',
      userId: input.userId,
      node: mapNode(updatedUser),
    });

    return {
      success: true,
    };
  }
}
