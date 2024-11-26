import { generateId, IdType } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MarkNodeAsSeenMutationInput,
  MarkNodeAsSeenMutationOutput,
} from '@/shared/mutations/mark-node-as-seen';
import { UserNode } from '@/shared/types/nodes';
import { eventBus } from '@/shared/lib/event-bus';

export class MarkNodeAsSeenMutationHandler
  implements MutationHandler<MarkNodeAsSeenMutationInput>
{
  async handleMutation(
    input: MarkNodeAsSeenMutationInput
  ): Promise<MarkNodeAsSeenMutationOutput> {
    // const workspaceDatabase = await databaseService.getWorkspaceDatabase(
    //   input.userId
    // );

    // const existingUserNode = await workspaceDatabase
    //   .selectFrom('user_nodes')
    //   .where('node_id', '=', input.nodeId)
    //   .where('user_id', '=', input.userId)
    //   .selectAll()
    //   .executeTakeFirst();

    // if (
    //   existingUserNode &&
    //   existingUserNode.last_seen_version_id === input.versionId
    // ) {
    //   const lastSeenAt = existingUserNode.last_seen_at
    //     ? new Date(existingUserNode.last_seen_at)
    //     : null;
    //   // if has been seen in the last 10 minutes, skip it. We don't want to spam the server with seen events.
    //   if (lastSeenAt && Date.now() - lastSeenAt.getTime() < 10 * 60 * 1000) {
    //     return {
    //       success: true,
    //     };
    //   }
    // }

    // let changeId: number | undefined;
    // let userNode: UserNode | undefined;

    // const changeData: LocalUserNodeChangeData = {
    //   type: 'user_node_update',
    //   nodeId: input.nodeId,
    //   userId: input.userId,
    //   lastSeenVersionId: input.versionId,
    //   lastSeenAt: new Date().toISOString(),
    //   mentionsCount: 0,
    //   versionId: generateId(IdType.Version),
    // };

    // await workspaceDatabase.transaction().execute(async (trx) => {
    //   const updatedUserNode = await trx
    //     .updateTable('user_nodes')
    //     .set({
    //       last_seen_version_id: input.versionId,
    //       last_seen_at: new Date().toISOString(),
    //       mentions_count: 0,
    //       version_id: generateId(IdType.Version),
    //     })
    //     .where('node_id', '=', input.nodeId)
    //     .where('user_id', '=', input.userId)
    //     .returningAll()
    //     .executeTakeFirst();

    //   if (updatedUserNode) {
    //     userNode = {
    //       userId: updatedUserNode.user_id,
    //       nodeId: updatedUserNode.node_id,
    //       lastSeenAt: updatedUserNode.last_seen_at,
    //       lastSeenVersionId: updatedUserNode.last_seen_version_id,
    //       mentionsCount: updatedUserNode.mentions_count,
    //       attributes: updatedUserNode.attributes,
    //       versionId: updatedUserNode.version_id,
    //       createdAt: updatedUserNode.created_at,
    //       updatedAt: updatedUserNode.updated_at,
    //     };
    //   }

    //   const createdChange = await trx
    //     .insertInto('changes')
    //     .values({
    //       data: JSON.stringify(changeData),
    //       created_at: new Date().toISOString(),
    //       retry_count: 0,
    //     })
    //     .returning('id')
    //     .executeTakeFirst();

    //   if (createdChange) {
    //     changeId = createdChange.id;
    //   }
    // });

    // if (userNode) {
    //   eventBus.publish({
    //     type: 'user_node_created',
    //     userId: input.userId,
    //     userNode,
    //   });
    // }

    // if (changeId) {
    //   eventBus.publish({
    //     type: 'change_created',
    //     userId: input.userId,
    //     changeId,
    //   });
    // }

    return {
      success: true,
    };
  }
}
