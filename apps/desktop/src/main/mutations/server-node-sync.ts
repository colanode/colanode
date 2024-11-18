import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { MutationHandler } from '@/main/types';
import {
  ServerNodeSyncMutationInput,
  ServerNodeSyncMutationOutput,
} from '@/shared/mutations/server-node-sync';
import { nodeService } from '@/main/services/node-service';

export class ServerNodeSyncMutationHandler
  implements MutationHandler<ServerNodeSyncMutationInput>
{
  public async handleMutation(
    input: ServerNodeSyncMutationInput
  ): Promise<ServerNodeSyncMutationOutput> {
    try {
      const workspace = await databaseService.appDatabase
        .selectFrom('workspaces')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', '=', input.accountId),
            eb('workspace_id', '=', input.node.workspaceId),
          ])
        )
        .executeTakeFirst();

      if (!workspace) {
        return {
          success: false,
        };
      }

      const userId = workspace.user_id;
      const synced = await nodeService.serverSync(userId, input.node);
      if (synced) {
        socketService.sendMessage(workspace.account_id, {
          type: 'local_node_sync',
          nodeId: input.node.id,
          userId: userId,
          versionId: input.node.versionId,
          workspaceId: input.node.workspaceId,
        });

        return {
          success: true,
        };
      }
    } catch (error) {
      // console.error('Error syncing node', error);
    }

    return {
      success: false,
    };
  }
}
