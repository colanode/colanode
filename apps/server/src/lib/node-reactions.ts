import {
  CanReactNodeContext,
  CreateNodeReactionMutation,
  DeleteNodeReactionMutation,
  getNodeModel,
  MutationStatus,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectUser } from '@colanode/server/data/schema';
import { eventBus } from '@colanode/server/lib/event-bus';
import { fetchNodeTree, mapNode } from '@colanode/server/lib/nodes';

export const createNodeReaction = async (
  user: SelectUser,
  mutation: CreateNodeReactionMutation
): Promise<MutationStatus> => {
  const tree = await fetchNodeTree(mutation.data.nodeId);
  if (!tree) {
    return MutationStatus.NOT_FOUND;
  }

  const node = tree[tree.length - 1]!;
  if (!node) {
    return MutationStatus.NOT_FOUND;
  }

  const root = tree[0]!;
  if (!root) {
    return MutationStatus.NOT_FOUND;
  }

  const model = getNodeModel(node.type);
  const context: CanReactNodeContext = {
    user: {
      id: user.id,
      role: user.role,
      accountId: user.account_id,
      workspaceId: user.workspace_id,
    },
    tree: tree.map(mapNode),
    node: mapNode(node),
  };

  if (!model.canReact(context)) {
    return MutationStatus.FORBIDDEN;
  }

  const createdNodeReaction = await database
    .insertInto('node_reactions')
    .returningAll()
    .values({
      node_id: mutation.data.nodeId,
      collaborator_id: user.id,
      reaction: mutation.data.reaction,
      workspace_id: root.workspace_id,
      root_id: root.id,
      created_at: new Date(mutation.data.createdAt),
    })
    .onConflict((b) =>
      b.columns(['node_id', 'collaborator_id', 'reaction']).doUpdateSet({
        created_at: new Date(mutation.data.createdAt),
        deleted_at: null,
      })
    )
    .executeTakeFirst();

  if (!createdNodeReaction) {
    return MutationStatus.INTERNAL_SERVER_ERROR;
  }

  eventBus.publish({
    type: 'node.reaction.created',
    nodeId: createdNodeReaction.node_id,
    collaboratorId: createdNodeReaction.collaborator_id,
    rootId: createdNodeReaction.root_id,
    workspaceId: createdNodeReaction.workspace_id,
  });

  return MutationStatus.CREATED;
};

export const deleteNodeReaction = async (
  user: SelectUser,
  mutation: DeleteNodeReactionMutation
): Promise<MutationStatus> => {
  const tree = await fetchNodeTree(mutation.data.nodeId);
  if (!tree) {
    return MutationStatus.NOT_FOUND;
  }

  const node = tree[tree.length - 1]!;
  if (!node) {
    return MutationStatus.NOT_FOUND;
  }

  const root = tree[0]!;
  if (!root) {
    return MutationStatus.NOT_FOUND;
  }

  const model = getNodeModel(node.type);
  const context: CanReactNodeContext = {
    user: {
      id: user.id,
      role: user.role,
      accountId: user.account_id,
      workspaceId: user.workspace_id,
    },
    tree: tree.map(mapNode),
    node: mapNode(node),
  };

  if (!model.canReact(context)) {
    return MutationStatus.FORBIDDEN;
  }

  const deletedNodeReaction = await database
    .updateTable('node_reactions')
    .set({
      deleted_at: new Date(mutation.data.deletedAt),
    })
    .where('node_id', '=', mutation.data.nodeId)
    .where('collaborator_id', '=', user.id)
    .where('reaction', '=', mutation.data.reaction)
    .executeTakeFirst();

  if (!deletedNodeReaction) {
    return MutationStatus.OK;
  }

  eventBus.publish({
    type: 'node.reaction.deleted',
    nodeId: mutation.data.nodeId,
    collaboratorId: user.id,
    rootId: node.root_id,
    workspaceId: node.workspace_id,
  });

  return MutationStatus.OK;
};
