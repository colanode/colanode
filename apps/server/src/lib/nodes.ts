import { cloneDeep } from 'lodash-es';

import {
  CanCreateNodeContext,
  CanDeleteNodeContext,
  CanUpdateAttributesContext,
  CreateNodeMutationData,
  DeleteNodeMutationData,
  extractNodeCollaborators,
  generateId,
  getNodeModel,
  IdType,
  Node,
  NodeAttributes,
  MutationStatus,
  UpdateNodeMutationData,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import {
  CreateCollaboration,
  SelectCollaboration,
  SelectNode,
  SelectNodeUpdate,
  SelectUser,
} from '@colanode/server/data/schema';
import { scheduleNodeEmbedding } from '@colanode/server/lib/ai/embeddings';
import {
  applyCollaboratorUpdates,
  checkCollaboratorChanges,
} from '@colanode/server/lib/collaborations';
import { eventBus } from '@colanode/server/lib/event-bus';
import { createLogger } from '@colanode/server/lib/logger';
import { storage } from '@colanode/server/lib/storage';
import { jobService } from '@colanode/server/services/job-service';
import {
  ConcurrentUpdateResult,
  CreateNodeInput,
  UpdateNodeInput,
} from '@colanode/server/types/nodes';

const logger = createLogger('server:lib:nodes');

const UPDATE_RETRIES_LIMIT = 10;

export const mapNode = (node: SelectNode): Node => {
  return {
    id: node.id,
    parentId: node.parent_id,
    rootId: node.root_id,
    type: node.type,
    attributes: node.attributes,
    createdAt: node.created_at.toISOString(),
    createdBy: node.created_by,
    updatedAt: node.updated_at?.toISOString() ?? null,
    updatedBy: node.updated_by ?? null,
  } as Node;
};

export const fetchNode = async (nodeId: string): Promise<SelectNode | null> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  return result ?? null;
};

export const fetchNodeUpdates = async (
  nodeId: string
): Promise<SelectNodeUpdate[]> => {
  const result = await database
    .selectFrom('node_updates')
    .selectAll()
    .where('node_id', '=', nodeId)
    .orderBy('id', 'desc')
    .execute();

  return result;
};

export const fetchNodeTree = async (nodeId: string): Promise<SelectNode[]> => {
  const result = await database
    .selectFrom('nodes')
    .selectAll()
    .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
    .where('node_paths.descendant_id', '=', nodeId)
    .orderBy('node_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchNodeDescendants = async (
  nodeId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('node_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', nodeId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const createNode = async (input: CreateNodeInput): Promise<boolean> => {
  const model = getNodeModel(input.attributes.type);
  const ydoc = new YDoc();
  const update = ydoc.update(model.attributesSchema, input.attributes);

  if (!update) {
    return false;
  }

  const attributes = ydoc.getObject<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);
  const state = ydoc.getState();
  const date = new Date();
  const updateId = generateId(IdType.Update);

  const collaborationsToCreate: CreateCollaboration[] = Object.entries(
    extractNodeCollaborators(attributes)
  ).map(([userId, role]) => ({
    collaborator_id: userId,
    node_id: input.nodeId,
    workspace_id: input.workspaceId,
    role,
    created_at: new Date(),
    created_by: input.userId,
  }));

  try {
    const { createdNode, createdCollaborations } = await database
      .transaction()
      .execute(async (trx) => {
        const createdNodeUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: updateId,
            node_id: input.nodeId,
            root_id: input.rootId,
            workspace_id: input.workspaceId,
            data: state,
            created_at: date,
            created_by: input.userId,
          })
          .executeTakeFirst();

        if (!createdNodeUpdate) {
          throw new Error('Failed to create node update');
        }

        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: input.nodeId,
            root_id: input.rootId,
            workspace_id: input.workspaceId,
            attributes: attributesJson,
            created_at: date,
            created_by: input.userId,
            revision: createdNodeUpdate.revision,
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        let createdCollaborations: SelectCollaboration[] = [];

        if (collaborationsToCreate.length > 0) {
          createdCollaborations = await trx
            .insertInto('collaborations')
            .returningAll()
            .values(collaborationsToCreate)
            .execute();
        }

        return { createdNode, createdCollaborations };
      });

    eventBus.publish({
      type: 'node.created',
      nodeId: input.nodeId,
      rootId: input.rootId,
      workspaceId: input.workspaceId,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration.created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    await scheduleNodeEmbedding(createdNode);

    return true;
  } catch (error) {
    logger.error(error, `Failed to create node transaction`);
    return false;
  }
};

export const updateNode = async (input: UpdateNodeInput): Promise<boolean> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryUpdateNode(input);

    if (result.type === 'success') {
      return true;
    }

    if (result.type === 'error') {
      return false;
    }
  }

  return false;
};

export const tryUpdateNode = async (
  input: UpdateNodeInput
): Promise<ConcurrentUpdateResult<SelectNode>> => {
  const node = await fetchNode(input.nodeId);
  if (!node) {
    return { type: 'error', error: 'Node not found' };
  }

  const nodeUpdates = await fetchNodeUpdates(input.nodeId);
  const ydoc = new YDoc();
  for (const nodeUpdate of nodeUpdates) {
    ydoc.applyUpdate(nodeUpdate.data);
  }

  const currentAttributes = ydoc.getObject<NodeAttributes>();
  const updatedAttributes = input.updater(cloneDeep(currentAttributes));
  if (!updatedAttributes) {
    return { type: 'error', error: 'Failed to update node' };
  }

  const model = getNodeModel(node.type);
  const update = ydoc.update(model.attributesSchema, updatedAttributes);

  if (!update) {
    return { type: 'error', error: 'Failed to update node' };
  }

  const attributes = ydoc.getObject<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);
  const date = new Date();
  const updateId = generateId(IdType.Update);

  const collaboratorChanges = checkCollaboratorChanges(
    node.attributes,
    attributes
  );

  try {
    const { updatedNode, createdCollaborations, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const createdNodeUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: updateId,
            node_id: input.nodeId,
            root_id: node.root_id,
            workspace_id: node.workspace_id,
            data: update,
            created_at: date,
            created_by: input.userId,
          })
          .executeTakeFirst();

        if (!createdNodeUpdate) {
          throw new Error('Failed to create node update');
        }

        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: date,
            updated_by: input.userId,
            revision: createdNodeUpdate.revision,
          })
          .where('id', '=', input.nodeId)
          .where('revision', '=', node.revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const { createdCollaborations, updatedCollaborations } =
          await applyCollaboratorUpdates(
            trx,
            input.nodeId,
            input.userId,
            input.workspaceId,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdCollaborations,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node.updated',
      nodeId: input.nodeId,
      rootId: node.root_id,
      workspaceId: input.workspaceId,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration.created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration.updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    await scheduleNodeEmbedding(updatedNode);

    return {
      type: 'success',
      output: updatedNode,
    };
  } catch {
    return { type: 'retry' };
  }
};

export const createNodeFromMutation = async (
  user: SelectUser,
  mutation: CreateNodeMutationData
): Promise<MutationStatus> => {
  const existingNode = await fetchNode(mutation.nodeId);
  if (existingNode) {
    return MutationStatus.OK;
  }

  const ydoc = new YDoc(mutation.data);
  const attributes = ydoc.getObject<NodeAttributes>();
  const model = getNodeModel(attributes.type);

  let parentId: string | null = null;

  if (attributes.type !== 'space' && attributes.type !== 'chat') {
    parentId = attributes.parentId;
  }

  const tree = parentId ? await fetchNodeTree(parentId) : [];
  const canCreateNodeContext: CanCreateNodeContext = {
    user: {
      id: user.id,
      role: user.role,
      workspaceId: user.workspace_id,
      accountId: user.account_id,
    },
    tree: tree.map(mapNode),
    attributes,
  };

  if (!model.canCreate(canCreateNodeContext)) {
    return MutationStatus.FORBIDDEN;
  }

  const rootId = tree[0]?.id ?? mutation.nodeId;
  const collaborationsToCreate: CreateCollaboration[] = Object.entries(
    extractNodeCollaborators(attributes)
  ).map(([userId, role]) => ({
    collaborator_id: userId,
    node_id: mutation.nodeId,
    workspace_id: user.workspace_id,
    role,
    created_at: new Date(),
    created_by: user.id,
  }));

  try {
    const { createdNode, createdCollaborations } = await database
      .transaction()
      .execute(async (trx) => {
        const createdNodeUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: mutation.updateId,
            node_id: mutation.nodeId,
            root_id: rootId,
            workspace_id: user.workspace_id,
            data: ydoc.getState(),
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
          })
          .executeTakeFirst();

        if (!createdNodeUpdate) {
          throw new Error('Failed to create node update');
        }

        const createdNode = await trx
          .insertInto('nodes')
          .returningAll()
          .values({
            id: mutation.nodeId,
            root_id: rootId,
            attributes: JSON.stringify(attributes),
            workspace_id: user.workspace_id,
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
            revision: createdNodeUpdate.revision,
          })
          .executeTakeFirst();

        if (!createdNode) {
          throw new Error('Failed to create node');
        }

        let createdCollaborations: SelectCollaboration[] = [];

        if (collaborationsToCreate.length > 0) {
          createdCollaborations = await trx
            .insertInto('collaborations')
            .returningAll()
            .values(collaborationsToCreate)
            .execute();
        }

        return { createdNode, createdCollaborations };
      });

    eventBus.publish({
      type: 'node.created',
      nodeId: mutation.nodeId,
      rootId,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration.created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    await scheduleNodeEmbedding(createdNode);

    return MutationStatus.CREATED;
  } catch (error) {
    logger.error(error, `Failed to create node transaction`);
    return MutationStatus.INTERNAL_SERVER_ERROR;
  }
};

export const updateNodeFromMutation = async (
  user: SelectUser,
  mutation: UpdateNodeMutationData
): Promise<MutationStatus> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const existingNodeUpdate = await database
      .selectFrom('node_updates')
      .selectAll()
      .where('id', '=', mutation.updateId)
      .executeTakeFirst();

    if (existingNodeUpdate) {
      return MutationStatus.OK;
    }

    const result = await tryUpdateNodeFromMutation(user, mutation);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return MutationStatus.INTERNAL_SERVER_ERROR;
    }
  }

  return MutationStatus.INTERNAL_SERVER_ERROR;
};

const tryUpdateNodeFromMutation = async (
  user: SelectUser,
  mutation: UpdateNodeMutationData
): Promise<ConcurrentUpdateResult<MutationStatus>> => {
  const tree = await fetchNodeTree(mutation.nodeId);
  if (tree.length === 0) {
    return { type: 'success', output: MutationStatus.NOT_FOUND };
  }

  const node = tree[tree.length - 1];
  if (!node || node.id !== mutation.nodeId) {
    return { type: 'success', output: MutationStatus.NOT_FOUND };
  }

  const nodeUpdates = await fetchNodeUpdates(mutation.nodeId);
  const ydoc = new YDoc();
  for (const nodeUpdate of nodeUpdates) {
    ydoc.applyUpdate(nodeUpdate.data);
  }

  const update = decodeState(mutation.data);
  ydoc.applyUpdate(update);

  const attributes = ydoc.getObject<NodeAttributes>();
  const attributesJson = JSON.stringify(attributes);

  const canUpdateNodeContext: CanUpdateAttributesContext = {
    user: {
      id: user.id,
      role: user.role,
      workspaceId: user.workspace_id,
      accountId: user.account_id,
    },
    tree: tree.map(mapNode),
    node: mapNode(node),
    attributes,
  };

  const model = getNodeModel(node.type);
  if (!model.canUpdateAttributes(canUpdateNodeContext)) {
    return { type: 'success', output: MutationStatus.FORBIDDEN };
  }

  const collaboratorChanges = checkCollaboratorChanges(
    node.attributes,
    attributes
  );

  try {
    const { updatedNode, createdCollaborations, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const createdNodeUpdate = await trx
          .insertInto('node_updates')
          .returningAll()
          .values({
            id: mutation.updateId,
            node_id: mutation.nodeId,
            root_id: node.root_id,
            workspace_id: user.workspace_id,
            data: update,
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
          })
          .executeTakeFirst();

        if (!createdNodeUpdate) {
          throw new Error('Failed to create node update');
        }

        const updatedNode = await trx
          .updateTable('nodes')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: new Date(mutation.createdAt),
            updated_by: user.id,
            revision: createdNodeUpdate.revision,
          })
          .where('id', '=', mutation.nodeId)
          .where('revision', '=', node.revision)
          .executeTakeFirst();

        if (!updatedNode) {
          throw new Error('Failed to update node');
        }

        const { createdCollaborations, updatedCollaborations } =
          await applyCollaboratorUpdates(
            trx,
            mutation.nodeId,
            user.id,
            user.workspace_id,
            collaboratorChanges
          );

        return {
          updatedNode,
          createdCollaborations,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'node.updated',
      nodeId: mutation.nodeId,
      rootId: node.root_id,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration.created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration.updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    await scheduleNodeEmbedding(updatedNode);

    return { type: 'success', output: MutationStatus.OK };
  } catch {
    return { type: 'retry' };
  }
};

export const deleteNodeFromMutation = async (
  user: SelectUser,
  mutation: DeleteNodeMutationData
): Promise<MutationStatus> => {
  const tree = await fetchNodeTree(mutation.nodeId);
  if (tree.length === 0) {
    return MutationStatus.OK;
  }

  const node = tree[tree.length - 1];
  if (!node || node.id !== mutation.nodeId) {
    return MutationStatus.OK;
  }

  const model = getNodeModel(node.type);
  const canDeleteNodeContext: CanDeleteNodeContext = {
    user: {
      id: user.id,
      role: user.role,
      workspaceId: user.workspace_id,
      accountId: user.account_id,
    },
    tree: tree.map(mapNode),
    node: mapNode(node),
  };

  if (!model.canDelete(canDeleteNodeContext)) {
    return MutationStatus.FORBIDDEN;
  }

  const { deletedNode } = await database.transaction().execute(async (trx) => {
    const deletedNode = await trx
      .deleteFrom('nodes')
      .returningAll()
      .where('id', '=', mutation.nodeId)
      .executeTakeFirst();

    if (!deletedNode) {
      throw new Error('Failed to delete node');
    }

    const createdTombstone = await trx
      .insertInto('node_tombstones')
      .returningAll()
      .values({
        id: node.id,
        root_id: node.root_id,
        workspace_id: node.workspace_id,
        deleted_at: new Date(mutation.deletedAt),
        deleted_by: user.id,
      })
      .executeTakeFirst();

    if (!createdTombstone) {
      throw new Error('Failed to create tombstone');
    }

    return {
      deletedNode,
    };
  });

  if (deletedNode.type === 'file') {
    const upload = await database
      .selectFrom('uploads')
      .selectAll()
      .where('file_id', '=', mutation.nodeId)
      .executeTakeFirst();

    if (upload) {
      await storage.delete(upload.path);

      await database
        .deleteFrom('uploads')
        .where('file_id', '=', mutation.nodeId)
        .execute();
    }
  }

  eventBus.publish({
    type: 'node.deleted',
    nodeId: mutation.nodeId,
    rootId: node.root_id,
    workspaceId: user.workspace_id,
  });

  await jobService.addJob({
    type: 'node.clean',
    nodeId: mutation.nodeId,
    parentId: node.parent_id,
    workspaceId: user.workspace_id,
    userId: user.id,
  });

  return MutationStatus.OK;
};
