import { CollaborationAttributes, ServerCollaboration } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';
import { decodeState, YDoc } from '@colanode/crdt';

class CollaborationService {
  public async applyServerCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    if (collaboration.deletedAt) {
      return this.deleteCollaboration(userId, collaboration);
    }

    return this.upsertCollaboration(userId, collaboration);
  }

  private async deleteCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .deleteFrom('collaborations')
      .where('user_id', '=', collaboration.userId)
      .where('node_id', '=', collaboration.nodeId)
      .execute();
  }

  private async upsertCollaboration(
    userId: string,
    collaboration: ServerCollaboration
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingCollaboration = await workspaceDatabase
      .selectFrom('collaborations')
      .selectAll()
      .where('user_id', '=', userId)
      .where('node_id', '=', collaboration.nodeId)
      .executeTakeFirst();

    const ydoc = new YDoc();
    if (existingCollaboration) {
      ydoc.applyUpdate(existingCollaboration.state);
    }

    const state = decodeState(collaboration.state);
    const number = BigInt(collaboration.number);

    ydoc.applyUpdate(state);
    const attributes = ydoc.getAttributes<CollaborationAttributes>();
    const attributesJson = JSON.stringify(attributes);

    await workspaceDatabase
      .insertInto('collaborations')
      .values({
        node_id: collaboration.nodeId,
        user_id: userId,
        attributes: attributesJson,
        state: state,
        created_at: collaboration.createdAt,
        number: number,
        updated_at: collaboration.updatedAt,
      })
      .onConflict((b) =>
        b.columns(['user_id', 'node_id']).doUpdateSet({
          attributes: attributesJson,
          state: state,
          number: number,
          updated_at: collaboration.updatedAt,
        })
      )
      .execute();
  }
}

export const collaborationService = new CollaborationService();
