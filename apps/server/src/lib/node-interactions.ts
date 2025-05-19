import {
  extractNodeRole,
  hasNodeRole,
  MarkNodeOpenedMutation,
  MarkNodeSeenMutation,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectUser } from '@colanode/server/data/schema';
import { eventBus } from '@colanode/server/lib/event-bus';
import { mapNode } from '@colanode/server/lib/nodes';

export const markNodeAsSeen = async (
  user: SelectUser,
  mutation: MarkNodeSeenMutation
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .select(['id', 'root_id', 'workspace_id'])
    .where('id', '=', mutation.data.nodeId)
    .executeTakeFirst();

  if (!node) {
    return false;
  }

  const root = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', node.root_id)
    .executeTakeFirst();

  if (!root) {
    return false;
  }

  const rootNode = mapNode(root);
  const role = extractNodeRole(rootNode, user.id);
  if (!role || !hasNodeRole(role, 'viewer')) {
    return false;
  }

  const existingInteraction = await database
    .selectFrom('node_interactions')
    .selectAll()
    .where('node_id', '=', mutation.data.nodeId)
    .where('collaborator_id', '=', user.id)
    .executeTakeFirst();

  if (
    existingInteraction &&
    existingInteraction.last_seen_at !== null &&
    existingInteraction.last_seen_at <= new Date(mutation.data.seenAt)
  ) {
    return true;
  }

  const lastSeenAt = new Date(mutation.data.seenAt);
  const firstSeenAt = existingInteraction?.first_seen_at ?? lastSeenAt;
  const createdInteraction = await database
    .insertInto('node_interactions')
    .returningAll()
    .values({
      node_id: mutation.data.nodeId,
      collaborator_id: user.id,
      first_seen_at: firstSeenAt,
      last_seen_at: lastSeenAt,
      root_id: root.id,
      workspace_id: root.workspace_id,
    })
    .onConflict((b) =>
      b.columns(['node_id', 'collaborator_id']).doUpdateSet({
        last_seen_at: lastSeenAt,
        first_seen_at: firstSeenAt,
      })
    )
    .executeTakeFirst();

  if (!createdInteraction) {
    return false;
  }

  eventBus.publish({
    type: 'node_interaction_updated',
    nodeId: createdInteraction.node_id,
    collaboratorId: createdInteraction.collaborator_id,
    rootId: createdInteraction.root_id,
    workspaceId: createdInteraction.workspace_id,
  });

  return true;
};

export const markNodeAsOpened = async (
  user: SelectUser,
  mutation: MarkNodeOpenedMutation
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .select(['id', 'root_id', 'workspace_id'])
    .where('id', '=', mutation.data.nodeId)
    .executeTakeFirst();

  if (!node) {
    return false;
  }

  const root = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', node.root_id)
    .executeTakeFirst();

  if (!root) {
    return false;
  }

  const rootNode = mapNode(root);
  const role = extractNodeRole(rootNode, user.id);
  if (!role || !hasNodeRole(role, 'viewer')) {
    return false;
  }

  const existingInteraction = await database
    .selectFrom('node_interactions')
    .selectAll()
    .where('node_id', '=', mutation.data.nodeId)
    .where('collaborator_id', '=', user.id)
    .executeTakeFirst();

  if (
    existingInteraction &&
    existingInteraction.last_opened_at !== null &&
    existingInteraction.last_opened_at <= new Date(mutation.data.openedAt)
  ) {
    return true;
  }

  const lastOpenedAt = new Date(mutation.data.openedAt);
  const firstOpenedAt = existingInteraction?.first_opened_at ?? lastOpenedAt;
  const createdInteraction = await database
    .insertInto('node_interactions')
    .returningAll()
    .values({
      node_id: mutation.data.nodeId,
      collaborator_id: user.id,
      first_opened_at: firstOpenedAt,
      last_opened_at: lastOpenedAt,
      root_id: root.id,
      workspace_id: root.workspace_id,
    })
    .onConflict((b) =>
      b.columns(['node_id', 'collaborator_id']).doUpdateSet({
        last_opened_at: lastOpenedAt,
        first_opened_at: firstOpenedAt,
      })
    )
    .executeTakeFirst();

  if (!createdInteraction) {
    return false;
  }

  eventBus.publish({
    type: 'node_interaction_updated',
    nodeId: createdInteraction.node_id,
    collaboratorId: createdInteraction.collaborator_id,
    rootId: createdInteraction.root_id,
    workspaceId: createdInteraction.workspace_id,
  });

  return true;
};
