import {
  ServerCollaboration,
  ServerDeletedCollaboration,
} from '@colanode/core';

import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { eventBus } from '@/shared/lib/event-bus';

class CollaborationService {
  private readonly debug = createDebugger('service:collaboration');

  public async applyServerCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    this.debug(
      `Applying server collaboration: ${collaboration.nodeId} for user ${userId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('collaborations')
      .values({
        user_id: userId,
        node_id: collaboration.nodeId,
        workspace_id: collaboration.workspaceId,
        roles: JSON.stringify(collaboration.roles),
        created_at: collaboration.createdAt,
        version: BigInt(collaboration.version),
      })
      .onConflict((oc) =>
        oc
          .columns(['user_id', 'node_id'])
          .doUpdateSet({
            roles: JSON.stringify(collaboration.roles),
            version: BigInt(collaboration.version),
            updated_at: collaboration.updatedAt,
          })
          .where('version', '<', BigInt(collaboration.version))
      )
      .execute();

    eventBus.publish({
      type: 'collaboration_synced',
      userId,
      nodeId: collaboration.nodeId,
      workspaceId: collaboration.workspaceId,
    });
  }

  public async applyServerDeletedCollaboration(
    userId: string,
    deletedCollaboration: ServerDeletedCollaboration
  ) {
    this.debug(
      `Applying server deleted collaboration: ${deletedCollaboration.nodeId} for user ${userId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('nodes')
        .where('id', '=', deletedCollaboration.nodeId)
        .execute();

      await tx
        .deleteFrom('transactions')
        .where('node_id', '=', deletedCollaboration.nodeId)
        .execute();

      await tx
        .deleteFrom('collaborations')
        .where('node_id', '=', deletedCollaboration.nodeId)
        .execute();

      await tx
        .deleteFrom('interaction_events')
        .where('node_id', '=', deletedCollaboration.nodeId)
        .execute();

      await tx
        .deleteFrom('interactions')
        .where('node_id', '=', deletedCollaboration.nodeId)
        .execute();
    });
  }
}

export const collaborationService = new CollaborationService();
