import {
  AccountStatus,
  generateId,
  IdType,
  UserStatus,
  WorkspaceStatus,
} from '@colanode/core';
import { YDoc } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import type {
  SelectAccount,
  SelectDevice,
  SelectUser,
  SelectWorkspace,
} from '@colanode/server/data/schema';
import { generatePasswordHash } from '@colanode/server/lib/accounts';
import { createNode } from '@colanode/server/lib/nodes';
import { generateToken } from '@colanode/server/lib/tokens';
import { DeviceType } from '@colanode/server/types/devices';
import { getNodeModel, NodeAttributes } from '@colanode/core';
import { FileStatus } from '@colanode/core';

export const createAccount = async (input?: {
  email?: string;
  name?: string;
  status?: AccountStatus;
  password?: string | null;
}): Promise<SelectAccount> => {
  const email = input?.email ?? `user-${generateId(IdType.Account)}@example.com`;
  const name = input?.name ?? 'Test User';
  const status = input?.status ?? AccountStatus.Active;

  const password = input?.password ?? 'password123';
  const passwordHash =
    password === null ? null : await generatePasswordHash(password);

  const account = await database
    .insertInto('accounts')
    .returningAll()
    .values({
      id: generateId(IdType.Account),
      name,
      email,
      avatar: null,
      password: passwordHash,
      attributes: null,
      created_at: new Date(),
      updated_at: null,
      status,
    })
    .executeTakeFirst();

  if (!account) {
    throw new Error('Failed to create account');
  }

  return account;
};

export const createWorkspace = async (input: {
  createdBy: string;
  name?: string;
  status?: WorkspaceStatus;
}): Promise<SelectWorkspace> => {
  const workspace = await database
    .insertInto('workspaces')
    .returningAll()
    .values({
      id: generateId(IdType.Workspace),
      name: input.name ?? 'Test Workspace',
      description: null,
      avatar: null,
      attrs: null,
      created_at: new Date(),
      created_by: input.createdBy,
      updated_at: null,
      updated_by: null,
      status: input.status ?? WorkspaceStatus.Active,
      max_file_size: null,
    })
    .executeTakeFirst();

  if (!workspace) {
    throw new Error('Failed to create workspace');
  }

  return workspace;
};

export const createUser = async (input: {
  workspaceId: string;
  account: SelectAccount;
  role: 'owner' | 'admin' | 'collaborator' | 'guest' | 'none';
  status?: UserStatus;
}): Promise<SelectUser> => {
  const user = await database
    .insertInto('users')
    .returningAll()
    .values({
      id: generateId(IdType.User),
      account_id: input.account.id,
      workspace_id: input.workspaceId,
      role: input.role,
      name: input.account.name,
      email: input.account.email,
      avatar: input.account.avatar,
      custom_name: null,
      custom_avatar: null,
      created_at: new Date(),
      created_by: input.account.id,
      status: input.status ?? UserStatus.Active,
      max_file_size: '0',
      storage_limit: '0',
    })
    .executeTakeFirst();

  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
};

export const createDevice = async (input: {
  accountId: string;
}): Promise<{ device: SelectDevice; token: string }> => {
  const deviceId = generateId(IdType.Device);
  const { token, salt, hash } = generateToken(deviceId);

  const device = await database
    .insertInto('devices')
    .returningAll()
    .values({
      id: deviceId,
      account_id: input.accountId,
      token_hash: hash,
      token_salt: salt,
      token_generated_at: new Date(),
      previous_token_hash: null,
      previous_token_salt: null,
      type: DeviceType.Web,
      version: 'test',
      platform: 'test',
      ip: '127.0.0.1',
      created_at: new Date(),
      synced_at: null,
    })
    .executeTakeFirst();

  if (!device) {
    throw new Error('Failed to create device');
  }

  return { device, token };
};

export const createSpaceNode = async (input: {
  workspaceId: string;
  userId: string;
  name?: string;
}): Promise<string> => {
  const spaceId = generateId(IdType.Space);
  const attributes: NodeAttributes = {
    type: 'space',
    name: input.name ?? 'Test Space',
    description: null,
    avatar: null,
    visibility: 'private',
    collaborators: {
      [input.userId]: 'admin',
    },
  };

  const created = await createNode({
    nodeId: spaceId,
    rootId: spaceId,
    attributes,
    userId: input.userId,
    workspaceId: input.workspaceId,
  });

  if (!created) {
    throw new Error('Failed to create space node');
  }

  return spaceId;
};

export const createPageNode = async (input: {
  workspaceId: string;
  userId: string;
  parentId: string;
  rootId: string;
  name?: string;
}): Promise<string> => {
  const pageId = generateId(IdType.Page);
  const attributes: NodeAttributes = {
    type: 'page',
    name: input.name ?? 'Test Page',
    parentId: input.parentId,
  };

  const created = await createNode({
    nodeId: pageId,
    rootId: input.rootId,
    attributes,
    userId: input.userId,
    workspaceId: input.workspaceId,
  });

  if (!created) {
    throw new Error('Failed to create page node');
  }

  return pageId;
};

export const createFileNode = async (input: {
  workspaceId: string;
  userId: string;
  parentId: string;
  rootId: string;
  size: number;
  name?: string;
  extension?: string;
}): Promise<string> => {
  const fileId = generateId(IdType.File);
  const attributes: NodeAttributes = {
    type: 'file',
    subtype: 'other',
    parentId: input.parentId,
    name: input.name ?? 'Test File',
    originalName: input.name ?? 'test.txt',
    mimeType: 'text/plain',
    extension: input.extension ?? '.txt',
    size: input.size,
    version: '1',
    status: FileStatus.Pending,
  };

  const created = await createNode({
    nodeId: fileId,
    rootId: input.rootId,
    attributes,
    userId: input.userId,
    workspaceId: input.workspaceId,
  });

  if (!created) {
    throw new Error('Failed to create file node');
  }

  return fileId;
};

export const buildCreateNodeMutation = (input: {
  nodeId: string;
  attributes: NodeAttributes;
  createdAt?: string;
}) => {
  const model = getNodeModel(input.attributes.type);
  const ydoc = new YDoc();
  const update = ydoc.update(model.attributesSchema, input.attributes);
  if (!update) {
    throw new Error('Failed to create node update');
  }

  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: generateId(IdType.Mutation),
    createdAt,
    type: 'node.create' as const,
    data: {
      nodeId: input.nodeId,
      updateId: generateId(IdType.Update),
      createdAt,
      data: ydoc.getEncodedState(),
    },
  };
};

export const buildAuthHeader = (token: string) => {
  return { authorization: `Bearer ${token}` };
};
