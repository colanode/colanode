import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import {
  WorkspaceUsersInviteMutationInput,
  WorkspaceUsersInviteMutationOutput,
} from '@/shared/mutations/workspace-users-invite';
import { MutationHandler } from '@/main/types';
import { WorkspaceUsersInviteOutput } from '@colanode/core';
import { CreateNode } from '@/main/data/workspace/schema';
import { toUint8Array } from 'js-base64';
import { eventBus } from '@/shared/lib/event-bus';
import { mapNode } from '@/main/utils';

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

    const { data } = await httpClient.post<WorkspaceUsersInviteOutput>(
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

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const usersToCreate: CreateNode[] = data.users.map((user) => {
      return {
        id: user.id,
        attributes: JSON.stringify(user.attributes),
        state: toUint8Array(user.state),
        created_at: user.createdAt,
        created_by: user.createdBy,
        updated_at: user.updatedAt,
        updated_by: user.updatedBy,
        server_created_at: user.serverCreatedAt,
        server_updated_at: user.serverUpdatedAt,
        server_version_id: user.versionId,
        version_id: user.versionId,
      };
    });

    const createdNodes = await workspaceDatabase
      .insertInto('nodes')
      .returningAll()
      .values(usersToCreate)
      .onConflict((cb) => cb.doNothing())
      .execute();

    if (createdNodes.length !== usersToCreate.length) {
      return {
        success: false,
      };
    }

    for (const createdNode of createdNodes) {
      await eventBus.publish({
        type: 'node_created',
        userId: input.userId,
        node: mapNode(createdNode),
      });
    }

    return {
      success: true,
    };
  }
}
