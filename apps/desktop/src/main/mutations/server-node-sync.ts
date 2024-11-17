import { databaseService } from '@/main/data/database-service';
import { socketService } from '@/main/services/socket-service';
import { mapNode } from '@/main/utils';
import { MutationHandler } from '@/main/types';
import {
  ServerNodeSyncMutationInput,
  ServerNodeSyncMutationOutput,
} from '@/shared/mutations/server-node-sync';
import { YDoc } from '@colanode/crdt';
import { eventBus } from '@/shared/lib/event-bus';

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

      let count = 0;
      while (count++ < 10) {
        const existingNode = await workspaceDatabase
          .selectFrom('nodes')
          .where('id', '=', input.id)
          .selectAll()
          .executeTakeFirst();

        if (!existingNode) {
          const ydoc = new YDoc(input.id, input.state);
          const attributes = ydoc.getAttributes();
          const state = ydoc.getState();

          const result = await workspaceDatabase
            .insertInto('nodes')
            .returningAll()
            .values({
              id: input.id,
              attributes: JSON.stringify(attributes),
              state: state,
              created_at: input.createdAt,
              created_by: input.createdBy,
              version_id: input.versionId,
              server_created_at: input.serverCreatedAt,
              server_version_id: input.versionId,
            })
            .onConflict((cb) => cb.doNothing())
            .executeTakeFirst();

          if (result) {
            socketService.sendMessage(workspace.account_id, {
              type: 'local_node_sync',
              nodeId: input.id,
              userId: userId,
              versionId: input.versionId,
              workspaceId: input.workspaceId,
            });

            await eventBus.publish({
              type: 'node_created',
              userId: userId,
              node: mapNode(result),
            });

            return {
              success: true,
            };
          }
        } else {
          const ydoc = new YDoc(input.id, existingNode.state);
          ydoc.applyUpdate(input.state);

          const attributes = ydoc.getAttributes();
          const state = ydoc.getState();

          const updatedNode = await workspaceDatabase
            .updateTable('nodes')
            .returningAll()
            .set({
              state: state,
              attributes: JSON.stringify(attributes),
              server_created_at: input.serverCreatedAt,
              server_updated_at: input.serverUpdatedAt,
              server_version_id: input.versionId,
              updated_at: input.updatedAt,
              updated_by: input.updatedBy,
              version_id: input.versionId,
            })
            .where('id', '=', input.id)
            .where('version_id', '=', existingNode.version_id)
            .executeTakeFirst();

          if (updatedNode) {
            socketService.sendMessage(workspace.account_id, {
              type: 'local_node_sync',
              nodeId: input.id,
              userId: userId,
              versionId: input.versionId,
              workspaceId: input.workspaceId,
            });

            await eventBus.publish({
              type: 'node_updated',
              userId: userId,
              node: mapNode(updatedNode),
            });

            return {
              success: true,
            };
          }
        }
      }
    } catch (error) {
      // console.error('Error syncing node', error);
    }

    return {
      success: false,
    };
  }
}
