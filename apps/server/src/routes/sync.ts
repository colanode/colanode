import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
import { database, hasUpdateChanges } from '@/data/database';
import { Router } from 'express';
import { SelectWorkspaceUser } from '@/data/schema';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { synapse } from '@/services/synapse';
import { fetchNodeAncestors, mapNode } from '@/lib/nodes';
import {
  NodeMutationContext,
  registry,
  LocalChange,
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalUpdateNodeChangeData,
  LocalUserNodeChangeData,
  SyncChangeResult,
  SyncChangesInput,
  SyncChangeStatus,
  SyncNodeStatesInput,
  SyncNodeStatesOutput,
  ServerNodeState,
  ServerUserNodeState,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';

export const syncRouter = Router();

syncRouter.post(
  '/:workspaceId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspaceId = req.params.workspaceId as string;
    const input = req.body as SyncChangesInput;

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const results: SyncChangeResult[] = [];
    for (const change of input.changes) {
      try {
        const status = await handleLocalChange(workspaceUser, change);
        results.push({
          id: change.id,
          status: status,
        });
      } catch (error) {
        console.error('Error handling local change', error);
        results.push({
          id: change.id,
          status: 'error',
        });
      }
    }

    console.log('executed mutations', results);
    res.status(200).json({ results });
  }
);

syncRouter.post(
  '/:workspaceId/states',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspaceId = req.params.workspaceId as string;
    const input = req.body as SyncNodeStatesInput;
    const ids = input.ids;

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const rows = await database
      .selectFrom('nodes as n')
      .innerJoin('user_nodes as un', 'un.node_id', 'n.id')
      .select([
        'n.id as node_id',
        'n.state as node_state',
        'n.created_at as node_created_at',
        'n.created_by as node_created_by',
        'n.updated_at as node_updated_at',
        'n.updated_by as node_updated_by',
        'n.version_id as node_version_id',
        'un.version_id as user_node_version_id',
        'un.last_seen_at as user_node_last_seen_at',
        'un.last_seen_version_id as user_node_last_seen_version_id',
        'un.mentions_count as user_node_mentions_count',
        'un.created_at as user_node_created_at',
        'un.updated_at as user_node_updated_at',
      ])
      .where('un.user_id', '=', workspaceUser.id)
      .where('n.workspace_id', '=', workspaceId)
      .where('n.id', 'in', ids)
      .execute();

    const states: SyncNodeStatesOutput = {
      nodes: {},
    };

    for (const row of rows) {
      const nodeState: ServerNodeState = {
        id: row.node_id,
        workspaceId: workspaceId,
        state: encodeState(row.node_state),
        createdAt: row.node_created_at.toISOString(),
        createdBy: row.node_created_by,
        updatedAt: row.node_updated_at?.toISOString() ?? null,
        updatedBy: row.node_updated_by,
        serverCreatedAt: new Date().toISOString(),
        serverUpdatedAt: row.user_node_updated_at?.toISOString() ?? null,
        versionId: row.node_version_id,
      };

      const userNodeState: ServerUserNodeState = {
        nodeId: row.node_id,
        userId: workspaceUser.id,
        workspaceId: workspaceId,
        versionId: row.user_node_version_id,
        lastSeenAt: row.user_node_last_seen_at?.toISOString() ?? null,
        lastSeenVersionId: row.user_node_last_seen_version_id,
        mentionsCount: row.user_node_mentions_count,
        createdAt: row.user_node_created_at.toISOString(),
        updatedAt: row.user_node_updated_at?.toISOString() ?? null,
      };

      states.nodes[row.node_id] = {
        node: nodeState,
        userNode: userNodeState,
      };
    }

    res.status(200).json({ nodes: states });
  }
);

const handleLocalChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange
): Promise<SyncChangeStatus> => {
  switch (change.data.type) {
    case 'node_create': {
      return handleCreateNodeChange(workspaceUser, change.data);
    }
    case 'node_update': {
      return handleUpdateNodeChange(workspaceUser, change.data);
    }
    case 'node_delete': {
      return handleDeleteNodeChange(workspaceUser, change.data);
    }
    case 'user_node_update': {
      return handleUserNodeStateChange(workspaceUser, change.data);
    }
    default: {
      return 'error';
    }
  }
};

const handleCreateNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalCreateNodeChangeData
): Promise<SyncChangeStatus> => {
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', changeData.id)
    .executeTakeFirst();

  if (existingNode) {
    return 'success';
  }

  const ydoc = new YDoc(changeData.id, changeData.state);
  const attributes = ydoc.getAttributes();

  const model = registry.getModel(attributes.type);
  if (!model.schema.safeParse(attributes).success) {
    return 'error';
  }

  const ancestorRows = attributes.parentId
    ? await fetchNodeAncestors(attributes.parentId)
    : [];

  const ancestors = ancestorRows.map(mapNode);
  const context = new NodeMutationContext(
    workspaceUser.account_id,
    workspaceUser.workspace_id,
    changeData.createdBy,
    workspaceUser.role,
    ancestors
  );

  if (!model.canCreate(context, attributes)) {
    return 'error';
  }

  await database
    .insertInto('nodes')
    .values({
      id: changeData.id,
      attributes: JSON.stringify(attributes),
      workspace_id: workspaceUser.workspace_id,
      state: ydoc.getState(),
      created_at: new Date(changeData.createdAt),
      created_by: changeData.createdBy,
      version_id: changeData.versionId,
      server_created_at: new Date(),
    })
    .execute();

  const event: NodeCreatedEvent = {
    type: 'node_created',
    id: changeData.id,
    workspaceId: workspaceUser.workspace_id,
    attributes: attributes,
    createdBy: changeData.createdBy,
    createdAt: changeData.createdAt,
    serverCreatedAt: new Date().toISOString(),
    versionId: changeData.versionId,
  };

  await enqueueEvent(event);

  return 'success';
};

const handleUpdateNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalUpdateNodeChangeData
): Promise<SyncChangeStatus> => {
  let count = 0;
  while (count++ < 10) {
    const existingNode = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', changeData.id)
      .executeTakeFirst();

    if (
      !existingNode ||
      existingNode.workspace_id != workspaceUser.workspace_id
    ) {
      return 'error';
    }

    const ydoc = new YDoc(changeData.id, existingNode.state);

    for (const update of changeData.updates) {
      ydoc.applyUpdate(update);
    }

    const attributes = ydoc.getAttributes();
    const attributesJson = JSON.stringify(attributes);
    const state = ydoc.getState();

    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return 'error';
    }

    const ancestorRows = await fetchNodeAncestors(existingNode.id);
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === existingNode.id);
    if (!node) {
      return 'error';
    }

    const context = new NodeMutationContext(
      workspaceUser.account_id,
      workspaceUser.workspace_id,
      changeData.updatedBy,
      workspaceUser.role,
      ancestors
    );

    if (!model.canUpdate(context, node, attributes)) {
      return 'error';
    }

    const result = await database
      .updateTable('nodes')
      .set({
        attributes: attributesJson,
        state: state,
        updated_at: new Date(changeData.updatedAt),
        updated_by: changeData.updatedBy,
        version_id: changeData.versionId,
        server_updated_at: new Date(),
      })
      .where('id', '=', changeData.id)
      .where('version_id', '=', existingNode.version_id)
      .execute();

    if (hasUpdateChanges(result)) {
      const event: NodeUpdatedEvent = {
        type: 'node_updated',
        id: changeData.id,
        workspaceId: workspaceUser.workspace_id,
        beforeAttributes: existingNode.attributes,
        afterAttributes: attributes,
        updatedBy: changeData.updatedBy,
        updatedAt: changeData.updatedAt,
        serverUpdatedAt: new Date().toISOString(),
        versionId: changeData.versionId,
      };

      await enqueueEvent(event);

      return 'success';
    }
  }

  return 'error';
};

const handleDeleteNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalDeleteNodeChangeData
): Promise<SyncChangeStatus> => {
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', changeData.id)
    .selectAll()
    .executeTakeFirst();

  if (!existingNode) {
    return 'success';
  }

  if (existingNode.workspace_id !== workspaceUser.workspace_id) {
    return 'error';
  }

  const model = registry.getModel(existingNode.type);
  const ancestorRows = await fetchNodeAncestors(existingNode.id);
  const ancestors = ancestorRows.map(mapNode);
  const node = ancestors.find((ancestor) => ancestor.id === existingNode.id);
  if (!node) {
    return 'error';
  }

  const context = new NodeMutationContext(
    workspaceUser.account_id,
    workspaceUser.workspace_id,
    changeData.deletedBy,
    workspaceUser.role,
    ancestors
  );

  if (!model.canDelete(context, node)) {
    return 'error';
  }

  await database.deleteFrom('nodes').where('id', '=', changeData.id).execute();
  const event: NodeDeletedEvent = {
    type: 'node_deleted',
    id: changeData.id,
    workspaceId: workspaceUser.workspace_id,
    attributes: existingNode.attributes,
    deletedAt: new Date().toISOString(),
  };

  await enqueueEvent(event);

  return 'success';
};

const handleUserNodeStateChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalUserNodeChangeData
): Promise<SyncChangeStatus> => {
  if (workspaceUser.id !== changeData.userId) {
    return 'error';
  }

  await database
    .updateTable('user_nodes')
    .set({
      last_seen_version_id: changeData.lastSeenVersionId,
      last_seen_at: new Date(changeData.lastSeenAt),
      mentions_count: changeData.mentionsCount,
      version_id: changeData.versionId,
      updated_at: new Date(changeData.lastSeenAt),
    })
    .where('node_id', '=', changeData.nodeId)
    .where('user_id', '=', changeData.userId)
    .execute();

  await synapse.sendSynapseMessage({
    type: 'user_node_update',
    nodeId: changeData.nodeId,
    userId: changeData.userId,
    workspaceId: workspaceUser.workspace_id,
  });

  return 'success';
};
