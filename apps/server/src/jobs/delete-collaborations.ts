import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { JobHandler } from '@/types/jobs';
import { extractNodeCollaborators, NodeAttributes } from '@colanode/core';

export type DeleteCollaborationsInput = {
  type: 'delete_collaborations';
  nodeId: string;
  userId: string;
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    delete_collaborations: {
      input: DeleteCollaborationsInput;
    };
  }
}

export const deleteCollaborationsHandler: JobHandler<
  DeleteCollaborationsInput
> = async (input) => {
  const updatedCollaboration = await database
    .updateTable('collaborations')
    .returning(['node_id', 'user_id'])
    .where('node_id', '=', input.nodeId)
    .where('user_id', '=', input.userId)
    .set({ deleted_at: new Date() })
    .executeTakeFirst();

  if (updatedCollaboration) {
    eventBus.publish({
      type: 'collaboration_updated',
      nodeId: updatedCollaboration.node_id,
      userId: updatedCollaboration.user_id,
      workspaceId: input.workspaceId,
    });
  }

  await checkChildCollaborations(input.nodeId, input.userId, input.workspaceId);
};

const checkChildCollaborations = async (
  parentId: string,
  userId: string,
  workspaceId: string
) => {
  let lastId = parentId;

  const parentIdsToCheck: string[] = [];
  const nodeIdsToDelete: string[] = [];
  while (true) {
    const children = await database
      .selectFrom('nodes')
      .select(['id', 'type', 'attributes'])
      .where('parent_id', '=', parentId)
      .where('id', '>', lastId)
      .orderBy('id', 'asc')
      .limit(100)
      .execute();

    for (const child of children) {
      const collaborators = extractNodeCollaborators(child.attributes);
      if (!collaborators[userId]) {
        nodeIdsToDelete.push(child.id);
      }

      parentIdsToCheck.push(child.id);
      lastId = child.id;
    }

    if (children.length < 100) {
      break;
    }
  }

  if (nodeIdsToDelete.length > 0) {
    const updatedCollaborations = await database
      .updateTable('collaborations')
      .returning(['node_id', 'user_id'])
      .where('node_id', 'in', nodeIdsToDelete)
      .where('user_id', '=', userId)
      .set({ deleted_at: new Date() })
      .execute();

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        nodeId: updatedCollaboration.node_id,
        userId: updatedCollaboration.user_id,
        workspaceId,
      });
    }
  }

  if (parentIdsToCheck.length > 0) {
    for (const parentId of parentIdsToCheck) {
      await checkChildCollaborations(parentId, userId, workspaceId);
    }
  }
};
