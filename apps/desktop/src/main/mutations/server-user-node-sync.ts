import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { MutationHandler } from '@/main/types';
import {
  ServerUserNodeSyncMutationInput,
  ServerUserNodeSyncMutationOutput,
} from '@/shared/mutations/server-user-node-sync';
import { nodeService } from '@/main/services/node-service';

export class ServerUserNodeSyncMutationHandler
  implements MutationHandler<ServerUserNodeSyncMutationInput>
{
  public async handleMutation(
    input: ServerUserNodeSyncMutationInput
  ): Promise<ServerUserNodeSyncMutationOutput> {
    try {
      const workspace = await databaseService.appDatabase
        .selectFrom('workspaces')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', '=', input.accountId),
            eb('workspace_id', '=', input.userNode.workspaceId),
          ])
        )
        .executeTakeFirst();

      if (!workspace) {
        return {
          success: false,
        };
      }

      const userId = workspace.user_id;
      const synced = await nodeService.serverUserNodeSync(
        userId,
        input.userNode
      );

      if (synced) {
        socketService.sendMessage(workspace.account_id, {
          type: 'local_user_node_sync',
          userId: input.userNode.userId,
          nodeId: input.userNode.nodeId,
          versionId: input.userNode.versionId,
          workspaceId: input.userNode.workspaceId,
        });
      }
    } catch (error) {
      // console.error('Error syncing user node', error);
    }

    return {
      success: true,
    };
  }
}
