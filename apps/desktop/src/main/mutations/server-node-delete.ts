import { eventBus } from '@/shared/lib/event-bus';
import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { MutationHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import {
  ServerNodeDeleteMutationInput,
  ServerNodeDeleteMutationOutput,
} from '@/shared/mutations/server-node-delete';

export class ServerNodeDeleteMutationHandler
  implements MutationHandler<ServerNodeDeleteMutationInput>
{
  public async handleMutation(
    input: ServerNodeDeleteMutationInput
  ): Promise<ServerNodeDeleteMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ])
      )
      .executeTakeFirst();

    if (!workspace) {
      return {
        success: false,
      };
    }

    const userId = workspace.user_id;
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedNode = await workspaceDatabase
      .deleteFrom('nodes')
      .returningAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    socketService.sendMessage(workspace.account_id, {
      type: 'local_node_delete',
      nodeId: input.id,
      workspaceId: input.workspaceId,
    });

    if (deletedNode) {
      await eventBus.publish({
        type: 'node_deleted',
        userId,
        node: mapNode(deletedNode),
      });
    }

    return {
      success: true,
    };
  }
}
