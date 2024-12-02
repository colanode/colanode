import {
  ServerCollaboration,
  ServerCollaborationRevocation,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { createLogger } from '@/main/logger';
import { eventBus } from '@/shared/lib/event-bus';

class CollaborationService {
  private readonly logger = createLogger('collaboration-service');

  public async applyServerCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    this.logger.trace(
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

  public async applyServerCollaborationRevocation(
    userId: string,
    revocation: ServerCollaborationRevocation
  ) {
    this.logger.trace(
      `Applying server collaboration revocation: ${revocation.nodeId} for user ${userId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('nodes')
        .where('id', '=', revocation.nodeId)
        .execute();

      await tx
        .deleteFrom('node_transactions')
        .where('node_id', '=', revocation.nodeId)
        .execute();

      await tx
        .deleteFrom('collaborations')
        .where('node_id', '=', revocation.nodeId)
        .execute();

      await tx
        .deleteFrom('interaction_events')
        .where('node_id', '=', revocation.nodeId)
        .execute();

      await tx
        .deleteFrom('interactions')
        .where('node_id', '=', revocation.nodeId)
        .execute();
    });
  }
}

export const collaborationService = new CollaborationService();
