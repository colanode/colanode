import { database } from '@/data/database';
import { CreateNode, SelectAccount } from '@/data/schema';
import { WorkspaceStatus, WorkspaceUserStatus } from '@colanode/core';
import {
  ChannelAttributes,
  generateId,
  IdType,
  NodeRoles,
  PageAttributes,
  SpaceAttributes,
  UserAttributes,
  WorkspaceAttributes,
} from '@colanode/core';
import { NodeCreatedEvent } from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { YDoc } from '@colanode/crdt';

export const createDefaultWorkspace = async (account: SelectAccount) => {
  const createdAt = new Date();
  const workspaceId = generateId(IdType.Workspace);
  const workspaceName = `${account.name}'s Workspace`;
  const workspaceVersionId = generateId(IdType.Version);

  const user = buildUserNodeCreate(workspaceId, account);
  const workspace = buildWorkspaceNodeCreate(
    workspaceId,
    workspaceName,
    workspaceVersionId,
    user.id
  );
  const space = buildSpaceNodeCreate(workspaceId, user.id);
  const page = buildPageNodeCreate(workspaceId, space.id, user.id);
  const channel = buildChannelNodeCreate(workspaceId, space.id, user.id);

  const nodesToCreate = [workspace, user, space, page, channel];

  await database.transaction().execute(async (trx) => {
    await trx
      .insertInto('workspaces')
      .values({
        id: workspaceId,
        name: workspaceName,
        description: 'Personal workspace for ' + account.name,
        avatar: account.avatar,
        created_at: createdAt,
        created_by: account.id,
        status: WorkspaceStatus.Active,
        version_id: generateId(IdType.Version),
      })
      .execute();

    await trx
      .insertInto('workspace_users')
      .values({
        id: user.id,
        account_id: account.id,
        workspace_id: workspaceId,
        role: 'owner',
        created_at: createdAt,
        created_by: account.id,
        status: WorkspaceUserStatus.Active,
        version_id: generateId(IdType.Version),
      })
      .execute();

    await trx.insertInto('nodes').values(nodesToCreate).execute();
  });

  for (const node of nodesToCreate) {
    const event = buildNodeCreateEvent(node);
    await enqueueEvent(event);
  }
};

const buildWorkspaceNodeCreate = (
  workspaceId: string,
  workspaceName: string,
  workspaceVersionId: string,
  userId: string
): CreateNode => {
  const attributes: WorkspaceAttributes = {
    type: 'workspace',
    name: workspaceName,
    parentId: workspaceId,
  };

  const ydoc = new YDoc(workspaceId);
  ydoc.updateAttributes(attributes);
  const state = ydoc.getState();

  return {
    id: workspaceId,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: workspaceVersionId,
    server_created_at: new Date(),
    attributes: JSON.stringify(attributes),
    state,
  };
};

const buildUserNodeCreate = (
  workspaceId: string,
  account: SelectAccount
): CreateNode => {
  const id = generateId(IdType.User);
  const versionId = generateId(IdType.Version);

  const attributes: UserAttributes = {
    type: 'user',
    name: account.name,
    avatar: account.avatar,
    email: account.email,
    role: 'owner',
    accountId: account.id,
    parentId: workspaceId,
  };

  const ydoc = new YDoc(id);
  ydoc.updateAttributes(attributes);
  const state = ydoc.getState();

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: account.id,
    version_id: versionId,
    server_created_at: new Date(),
    attributes: JSON.stringify(attributes),
    state,
  };
};

const buildSpaceNodeCreate = (
  workspaceId: string,
  userId: string
): CreateNode => {
  const id = generateId(IdType.Space);
  const versionId = generateId(IdType.Version);

  const attributes: SpaceAttributes = {
    type: 'space',
    name: 'Home',
    description: 'Home space',
    parentId: workspaceId,
    collaborators: {
      [userId]: NodeRoles.Admin,
    },
  };

  const ydoc = new YDoc(id);
  ydoc.updateAttributes(attributes);
  const state = ydoc.getState();

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes: JSON.stringify(attributes),
    state,
  };
};

const buildPageNodeCreate = (
  workspaceId: string,
  spaceId: string,
  userId: string
): CreateNode => {
  const id = generateId(IdType.Page);
  const versionId = generateId(IdType.Version);

  const attributes: PageAttributes = {
    type: 'page',
    name: 'Notes',
    parentId: spaceId,
    content: {},
  };

  const ydoc = new YDoc(id);
  ydoc.updateAttributes(attributes);
  const state = ydoc.getState();

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes: JSON.stringify(attributes),
    state,
  };
};

const buildChannelNodeCreate = (
  workspaceId: string,
  spaceId: string,
  userId: string
): CreateNode => {
  const id = generateId(IdType.Channel);
  const versionId = generateId(IdType.Version);

  const attributes: ChannelAttributes = {
    type: 'channel',
    name: 'Discussions',
    parentId: spaceId,
  };

  const ydoc = new YDoc(id);
  ydoc.updateAttributes(attributes);
  const state = ydoc.getState();

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes: JSON.stringify(attributes),
    state,
  };
};

const buildNodeCreateEvent = (node: CreateNode): NodeCreatedEvent => {
  return {
    type: 'node_created',
    id: node.id,
    workspaceId: node.workspace_id,
    attributes: JSON.parse(node.attributes ?? '{}'),
    createdBy: node.created_by,
    createdAt: node.created_at.toISOString(),
    versionId: node.version_id,
    serverCreatedAt: node.server_created_at.toISOString(),
  };
};
