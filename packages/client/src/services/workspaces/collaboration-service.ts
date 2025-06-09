import { SelectCollaboration } from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { SyncCollaborationData, createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:service:collaboration');

export class CollaborationService {
  private readonly workspace: WorkspaceService;
  private readonly collaborations = new Map<string, SelectCollaboration>();

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
  }

  public async init() {
    const collaborations = await this.workspace.database
      .selectFrom('collaborations')
      .selectAll()
      .execute();

    for (const collaboration of collaborations) {
      this.collaborations.set(collaboration.node_id, collaboration);
    }
  }

  public getActiveCollaborations() {
    return Array.from(this.collaborations.values()).filter(
      (collaboration) => !collaboration.deleted_at
    );
  }

  public getCollaboration(nodeId: string) {
    return this.collaborations.get(nodeId);
  }

  public async syncServerCollaboration(collaboration: SyncCollaborationData) {
    debug(
      `Applying server collaboration: ${collaboration.nodeId} for workspace ${this.workspace.id}`
    );

    const upsertedCollaboration = await this.workspace.database
      .insertInto('collaborations')
      .returningAll()
      .values({
        node_id: collaboration.nodeId,
        role: collaboration.role,
        created_at: collaboration.createdAt,
        updated_at: collaboration.updatedAt,
        deleted_at: collaboration.deletedAt,
        revision: collaboration.revision,
      })
      .onConflict((oc) =>
        oc
          .columns(['node_id'])
          .doUpdateSet({
            role: collaboration.role,
            revision: collaboration.revision,
            updated_at: collaboration.updatedAt,
            deleted_at: collaboration.deletedAt,
          })
          .where('revision', '<', collaboration.revision)
      )
      .executeTakeFirst();

    this.collaborations.set(
      collaboration.nodeId,
      upsertedCollaboration as SelectCollaboration
    );

    if (collaboration.deletedAt) {
      this.collaborations.delete(collaboration.nodeId);

      await this.workspace.database
        .deleteFrom('nodes')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_interactions')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      await this.workspace.database
        .deleteFrom('node_reactions')
        .where('root_id', '=', collaboration.nodeId)
        .execute();

      eventBus.publish({
        type: 'collaboration.deleted',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        nodeId: collaboration.nodeId,
      });
    } else {
      eventBus.publish({
        type: 'collaboration.created',
        nodeId: collaboration.nodeId,
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
      });
    }
  }
}
