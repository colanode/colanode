import {
  CanCreateNodeContext,
  CanDeleteNodeContext,
  CanUpdateAttributesContext,
  createDebugger,
  CreateNodeMutationData,
  extractNodeCollaborators,
  generateId,
  getNodeModel,
  IdType,
  Node,
  NodeAttributes,
  UpdateNodeMutationData,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { cloneDeep } from 'lodash-es';

import { database } from '@/data/database';
import {
  CreateCollaboration,
  SelectCollaboration,
  SelectNode,
  SelectNodeUpdate,
  SelectUser,
} from '@/data/schema';
import {
  ConcurrentUpdateResult,
  CreateNodeInput,
  CreateNodeOutput,
  DeleteNodeInput,
  DeleteNodeOutput,
  UpdateNodeInput,
  UpdateNodeOutput,
} from '@/types/nodes';
import { eventBus } from '@/lib/event-bus';
import {
  applyCollaboratorUpdates,
  checkCollaboratorChanges,
} from '@/lib/collaborations';
import { jobService } from '@/services/job-service';
import { deleteFile } from '@/lib/files';
import { scheduleNodeEmbedding } from '@/lib/ai/embeddings';

const debug = createDebugger('server:lib:nodes');

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

export const createNode = async (
  input: CreateNodeInput
): Promise<CreateNodeOutput | null> => {
  const model = getNodeModel(input.attributes.type);
  const ydoc = new YDoc();
  const update = ydoc.update(model.attributesSchema, input.attributes);

  if (!update) {
    return null;
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
      type: 'node_created',
      nodeId: input.nodeId,
      rootId: input.rootId,
      workspaceId: input.workspaceId,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    await scheduleNodeEmbedding(createdNode);

    return {
      node: createdNode,
    };
  } catch (error) {
    debug(`Failed to create node transaction: ${error}`);
    return null;
  }
};

export const updateNode = async (
  input: UpdateNodeInput
): Promise<UpdateNodeOutput | null> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryUpdateNode(input);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return null;
    }
  }

  return null;
};

export const tryUpdateNode = async (
  input: UpdateNodeInput
): Promise<ConcurrentUpdateResult<UpdateNodeOutput>> => {
  const node = await fetchNode(input.nodeId);
  if (!node) {
    return { type: 'error', output: null };
  }

  const nodeUpdates = await fetchNodeUpdates(input.nodeId);
  const ydoc = new YDoc();
  for (const nodeUpdate of nodeUpdates) {
    ydoc.applyUpdate(nodeUpdate.data);
  }

  const currentAttributes = ydoc.getObject<NodeAttributes>();
  const updatedAttributes = input.updater(cloneDeep(currentAttributes));
  if (!updatedAttributes) {
    return { type: 'error', output: null };
  }

  const model = getNodeModel(node.type);
  const update = ydoc.update(model.attributesSchema, updatedAttributes);

  if (!update) {
    return { type: 'success', output: null };
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
      type: 'node_updated',
      nodeId: input.nodeId,
      rootId: node.root_id,
      workspaceId: input.workspaceId,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: input.nodeId,
        workspaceId: input.workspaceId,
      });
    }

    await scheduleNodeEmbedding(updatedNode);

    return {
      type: 'success',
      output: {
        node: updatedNode,
      },
    };
  } catch {
    return { type: 'retry', output: null };
  }
};

export const createNodeFromMutation = async (
  user: SelectUser,
  mutation: CreateNodeMutationData
): Promise<CreateNodeOutput | null> => {
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
    return null;
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
      type: 'node_created',
      nodeId: mutation.nodeId,
      rootId,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    await scheduleNodeEmbedding(createdNode);

    return {
      node: createdNode,
    };
  } catch (error) {
    debug(`Failed to create node transaction: ${error}`);
    return null;
  }
};

export const updateNodeFromMutation = async (
  user: SelectUser,
  mutation: UpdateNodeMutationData
): Promise<UpdateNodeOutput | null> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryUpdateNodeFromMutation(user, mutation);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return null;
    }
  }

  return null;
};

const tryUpdateNodeFromMutation = async (
  user: SelectUser,
  mutation: UpdateNodeMutationData
): Promise<ConcurrentUpdateResult<UpdateNodeOutput>> => {
  const tree = await fetchNodeTree(mutation.nodeId);
  if (tree.length === 0) {
    return { type: 'error', output: null };
  }

  const node = tree[tree.length - 1];
  if (!node || node.id !== mutation.nodeId) {
    return { type: 'error', output: null };
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
    return { type: 'error', output: null };
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
      type: 'node_updated',
      nodeId: mutation.nodeId,
      rootId: node.root_id,
      workspaceId: user.workspace_id,
    });

    for (const createdCollaboration of createdCollaborations) {
      eventBus.publish({
        type: 'collaboration_created',
        collaboratorId: createdCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        nodeId: mutation.nodeId,
        workspaceId: user.workspace_id,
      });
    }

    await scheduleNodeEmbedding(updatedNode);

    return {
      type: 'success',
      output: {
        node: updatedNode,
      },
    };
  } catch {
    return { type: 'retry', output: null };
  }
};

export const deleteNode = async (
  user: SelectUser,
  input: DeleteNodeInput
): Promise<DeleteNodeOutput | null> => {
  const tree = await fetchNodeTree(input.nodeId);
  if (tree.length === 0) {
    return null;
  }

  const node = tree[tree.length - 1];
  if (!node || node.id !== input.nodeId) {
    return null;
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
    return null;
  }

  const { deletedNode } = await database.transaction().execute(async (trx) => {
    const deletedNode = await trx
      .deleteFrom('nodes')
      .returningAll()
      .where('id', '=', input.nodeId)
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
        deleted_at: new Date(input.deletedAt),
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
      .where('file_id', '=', input.nodeId)
      .executeTakeFirst();

    if (upload) {
      await deleteFile(upload.path);

      await database
        .deleteFrom('uploads')
        .where('file_id', '=', input.nodeId)
        .execute();
    }
  }

  eventBus.publish({
    type: 'node_deleted',
    nodeId: input.nodeId,
    rootId: node.root_id,
    workspaceId: user.workspace_id,
  });

  await jobService.addJob({
    type: 'clean_node_data',
    nodeId: input.nodeId,
    workspaceId: user.workspace_id,
    userId: user.id,
  });

  return {
    node: deletedNode,
  };
};
