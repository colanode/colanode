import { Transaction } from 'kysely';

import {
  extractNodeCollaborators,
  NodeAttributes,
  NodeRole,
} from '@colanode/core';
import {
  DatabaseSchema,
  SelectCollaboration,
} from '@colanode/server/data/schema';

type CollaboratorChangeResult = {
  addedCollaborators: Record<string, NodeRole>;
  updatedCollaborators: Record<string, NodeRole>;
  removedCollaborators: Record<string, NodeRole>;
};

export const checkCollaboratorChanges = (
  beforeAttributes: NodeAttributes,
  afterAttributes: NodeAttributes
): CollaboratorChangeResult => {
  const beforeCollaborators = extractNodeCollaborators(beforeAttributes);
  const afterCollaborators = extractNodeCollaborators(afterAttributes);

  const addedCollaborators: Record<string, NodeRole> = {};
  const updatedCollaborators: Record<string, NodeRole> = {};
  const removedCollaborators: Record<string, NodeRole> = {};

  // Check for added and updated collaborators
  for (const [userId, newRole] of Object.entries(afterCollaborators)) {
    if (!(userId in beforeCollaborators)) {
      addedCollaborators[userId] = newRole;
    } else if (beforeCollaborators[userId] !== newRole) {
      updatedCollaborators[userId] = newRole;
    }
  }

  // Check for removed collaborators
  for (const [userId, oldRole] of Object.entries(beforeCollaborators)) {
    if (!(userId in afterCollaborators)) {
      removedCollaborators[userId] = oldRole;
    }
  }

  return {
    addedCollaborators,
    updatedCollaborators,
    removedCollaborators,
  };
};

export const applyCollaboratorUpdates = async (
  transaction: Transaction<DatabaseSchema>,
  nodeId: string,
  userId: string,
  workspaceId: string,
  updateResult: CollaboratorChangeResult
) => {
  const createdCollaborations: SelectCollaboration[] = [];
  const updatedCollaborations: SelectCollaboration[] = [];

  for (const [collaboratorId, role] of Object.entries(
    updateResult.addedCollaborators
  )) {
    const createdCollaboration = await transaction
      .insertInto('collaborations')
      .returningAll()
      .values({
        collaborator_id: collaboratorId,
        node_id: nodeId,
        workspace_id: workspaceId,
        role,
        created_at: new Date(),
        created_by: userId,
      })
      .onConflict((oc) =>
        oc.columns(['collaborator_id', 'node_id']).doUpdateSet({
          role,
          updated_at: new Date(),
          updated_by: userId,
          deleted_at: null,
          deleted_by: null,
        })
      )
      .executeTakeFirst();

    if (!createdCollaboration) {
      throw new Error('Failed to create collaboration');
    }

    createdCollaborations.push(createdCollaboration);
  }

  for (const [collaboratorId, role] of Object.entries(
    updateResult.updatedCollaborators
  )) {
    const updatedCollaboration = await transaction
      .updateTable('collaborations')
      .returningAll()
      .set({
        role,
        updated_at: new Date(),
        updated_by: userId,
        deleted_at: null,
        deleted_by: null,
      })
      .where('collaborator_id', '=', collaboratorId)
      .where('node_id', '=', nodeId)
      .executeTakeFirst();

    if (!updatedCollaboration) {
      throw new Error('Failed to update collaboration');
    }

    updatedCollaborations.push(updatedCollaboration);
  }

  const removedCollaboratorIds = Object.keys(updateResult.removedCollaborators);

  if (removedCollaboratorIds.length > 0) {
    const removedCollaborations = await transaction
      .updateTable('collaborations')
      .returningAll()
      .set({
        deleted_at: new Date(),
        deleted_by: userId,
      })
      .where('collaborator_id', 'in', removedCollaboratorIds)
      .where('node_id', '=', nodeId)
      .execute();

    if (removedCollaborations.length !== removedCollaboratorIds.length) {
      throw new Error('Failed to remove collaborations');
    }

    updatedCollaborations.push(...removedCollaborations);
  }

  return { createdCollaborations, updatedCollaborations };
};
