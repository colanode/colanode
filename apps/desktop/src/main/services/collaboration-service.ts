import { ServerCollaborationRevocation } from '@colanode/core';
import { databaseService } from '@/main/data/database-service';

class CollaborationService {
  public async applyServerCollaborationRevocation(
    userId: string,
    revocation: ServerCollaborationRevocation
  ) {
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
    });
  }
}

export const collaborationService = new CollaborationService();
