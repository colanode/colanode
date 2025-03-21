import { createDebugger, SyncNodeInteractionData } from '@colanode/core';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { eventBus } from '@/shared/lib/event-bus';
import { mapNodeInteraction } from '@/main/lib/mappers';

export class NodeInteractionService {
  private readonly debug = createDebugger('desktop:service:node-interaction');
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async syncServerNodeInteraction(
    nodeInteraction: SyncNodeInteractionData
  ) {
    const existingNodeInteraction = await this.workspace.database
      .selectFrom('node_interactions')
      .selectAll()
      .where('node_id', '=', nodeInteraction.nodeId)
      .where('collaborator_id', '=', nodeInteraction.collaboratorId)
      .executeTakeFirst();

    const revision = BigInt(nodeInteraction.revision);
    if (existingNodeInteraction) {
      if (existingNodeInteraction.revision === revision) {
        this.debug(
          `Server node interaction for node ${nodeInteraction.nodeId} is already synced`
        );
        return;
      }
    }

    const createdNodeInteraction = await this.workspace.database
      .insertInto('node_interactions')
      .returningAll()
      .values({
        node_id: nodeInteraction.nodeId,
        root_id: nodeInteraction.rootId,
        collaborator_id: nodeInteraction.collaboratorId,
        first_seen_at: nodeInteraction.firstSeenAt,
        last_seen_at: nodeInteraction.lastSeenAt,
        last_opened_at: nodeInteraction.lastOpenedAt,
        first_opened_at: nodeInteraction.firstOpenedAt,
        revision,
      })
      .onConflict((b) =>
        b.columns(['node_id', 'collaborator_id']).doUpdateSet({
          last_seen_at: nodeInteraction.lastSeenAt,
          first_seen_at: nodeInteraction.firstSeenAt,
          last_opened_at: nodeInteraction.lastOpenedAt,
          first_opened_at: nodeInteraction.firstOpenedAt,
          revision,
        })
      )
      .executeTakeFirst();

    if (!createdNodeInteraction) {
      return;
    }

    eventBus.publish({
      type: 'node_interaction_updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      nodeInteraction: mapNodeInteraction(createdNodeInteraction),
    });

    this.debug(
      `Server node interaction for node ${nodeInteraction.nodeId} has been synced`
    );
  }
}
