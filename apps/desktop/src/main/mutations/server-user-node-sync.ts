import { eventBus } from '@/shared/lib/event-bus';
import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { MutationHandler } from '@/main/types';
import {
  ServerUserNodeSyncMutationInput,
  ServerUserNodeSyncMutationOutput,
} from '@/shared/mutations/server-user-node-sync';

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

      const createdUserNode = await workspaceDatabase
        .insertInto('user_nodes')
        .returningAll()
        .values({
          user_id: input.userId,
          node_id: input.nodeId,
          version_id: input.versionId,
          last_seen_at: input.lastSeenAt,
          last_seen_version_id: input.lastSeenVersionId,
          mentions_count: input.mentionsCount,
          created_at: input.createdAt,
          updated_at: input.updatedAt,
        })
        .onConflict((cb) =>
          cb.columns(['node_id', 'user_id']).doUpdateSet({
            last_seen_at: input.lastSeenAt,
            last_seen_version_id: input.lastSeenVersionId,
            mentions_count: input.mentionsCount,
            updated_at: input.updatedAt,
            version_id: input.versionId,
          })
        )
        .executeTakeFirst();

      socketService.sendMessage(workspace.account_id, {
        type: 'local_user_node_sync',
        userId: input.userId,
        nodeId: input.nodeId,
        versionId: input.versionId,
        workspaceId: input.workspaceId,
      });

      if (createdUserNode) {
        eventBus.publish({
          type: 'user_node_created',
          userId: userId,
          userNode: {
            userId: createdUserNode.user_id,
            nodeId: createdUserNode.node_id,
            lastSeenAt: createdUserNode.last_seen_at,
            lastSeenVersionId: createdUserNode.last_seen_version_id,
            mentionsCount: createdUserNode.mentions_count,
            attributes: createdUserNode.attributes,
            versionId: createdUserNode.version_id,
            createdAt: createdUserNode.created_at,
            updatedAt: createdUserNode.updated_at,
          },
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
