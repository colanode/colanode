import { database } from '@/data/database';
import { CreateCollaboration } from '@/data/schema';
import { JobHandler } from '@/types/jobs';
import { buildDefaultCollaboration } from '@/lib/collaborations';
import { NodeType } from '@colanode/core';
import { eventBus } from '@/lib/event-bus';

export type CreateCollaborationsInput = {
  type: 'create_collaborations';
  userId: string;
  nodeId: string;
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    create_collaborations: {
      input: CreateCollaborationsInput;
    };
  }
}

export const createCollaborationsHandler: JobHandler<
  CreateCollaborationsInput
> = async (input) => {
  const nodeRow = await database
    .selectFrom('nodes')
    .where('id', '=', input.nodeId)
    .select(['id', 'type'])
    .executeTakeFirst();

  if (!nodeRow) {
    return;
  }

  const descendants = await database
    .selectFrom('node_paths')
    .where('ancestor_id', '=', input.nodeId)
    .selectAll()
    .execute();

  if (descendants.length === 0) {
    return;
  }

  const collaborationsToCreate: CreateCollaboration[] = [];
  for (const descendant of descendants) {
    collaborationsToCreate.push(
      buildDefaultCollaboration(
        input.userId,
        descendant.descendant_id,
        nodeRow.type as NodeType,
        input.workspaceId
      )
    );
  }

  const createdCollaborations = await database
    .insertInto('collaborations')
    .returning(['node_id', 'user_id', 'workspace_id'])
    .values(collaborationsToCreate)
    .onConflict((b) =>
      b.columns(['node_id', 'user_id']).doUpdateSet({
        deleted_at: null,
      })
    )
    .execute();

  for (const createdCollaboration of createdCollaborations) {
    eventBus.publish({
      type: 'collaboration_created',
      nodeId: createdCollaboration.node_id,
      userId: createdCollaboration.user_id,
      workspaceId: createdCollaboration.workspace_id,
    });
  }
};
