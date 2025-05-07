import {
  IdType,
  generateId,
  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceStatus,
  UserStatus,
} from '@colanode/core';

import { createDocument } from '@/lib/documents';
import { SelectAccount } from '@/data/schema';
import { database } from '@/data/database';
import { config } from '@/lib/config';
import { eventBus } from '@/lib/event-bus';
import {
  generateInitialMessageBlocks,
  generateWelcomePageBlocks,
} from '@/lib/blocks';
import { createNode } from '@/lib/nodes';

export const createWorkspace = async (
  account: SelectAccount,
  input: WorkspaceCreateInput
): Promise<WorkspaceOutput> => {
  const date = new Date();
  const workspaceId = generateId(IdType.Workspace);
  const userId = generateId(IdType.User);
  const spaceId = generateId(IdType.Space);

  const workspace = await database
    .insertInto('workspaces')
    .values({
      id: workspaceId,
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      created_at: date,
      created_by: account.id,
      status: WorkspaceStatus.Active,
    })
    .returningAll()
    .executeTakeFirst();

  if (!workspace) {
    throw new Error('Failed to create workspace.');
  }

  const user = await database
    .insertInto('users')
    .values({
      id: userId,
      account_id: account.id,
      workspace_id: workspaceId,
      role: 'owner',
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      storage_limit: config.user.storageLimit,
      max_file_size: config.user.maxFileSize,
      created_at: date,
      created_by: account.id,
      status: UserStatus.Active,
    })
    .returningAll()
    .executeTakeFirst();

  if (!user) {
    throw new Error('Failed to create workspace user.');
  }

  const createSpaceOutput = await createNode({
    nodeId: spaceId,
    rootId: spaceId,
    attributes: {
      type: 'space',
      name: 'Home',
      description: 'This is your home space.',
      visibility: 'private',
      collaborators: {
        [userId]: 'admin',
      },
    },
    userId: userId,
    workspaceId: workspaceId,
  });

  if (createSpaceOutput) {
    const pageId = generateId(IdType.Page);
    await createNode({
      nodeId: pageId,
      rootId: spaceId,
      attributes: {
        type: 'page',
        name: 'Welcome',
        parentId: spaceId,
      },
      userId: userId,
      workspaceId: workspaceId,
    });

    await createDocument({
      content: {
        type: 'rich_text',
        blocks: generateWelcomePageBlocks(pageId),
      },
      nodeId: pageId,
      userId: userId,
      workspaceId: workspaceId,
    });

    const channelId = generateId(IdType.Channel);
    await createNode({
      nodeId: channelId,
      rootId: spaceId,
      attributes: {
        type: 'channel',
        name: 'Discussions',
        parentId: spaceId,
      },
      userId: userId,
      workspaceId: workspaceId,
    });

    const messageId = generateId(IdType.Message);
    await createNode({
      nodeId: messageId,
      rootId: spaceId,
      attributes: {
        type: 'message',
        parentId: channelId,
        subtype: 'standard',
        content: generateInitialMessageBlocks(messageId),
      },
      userId: userId,
      workspaceId: workspaceId,
    });
  }

  eventBus.publish({
    type: 'workspace_created',
    workspaceId: workspaceId,
  });

  eventBus.publish({
    type: 'user_created',
    userId: userId,
    workspaceId: workspaceId,
    accountId: account.id,
  });

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    avatar: workspace.avatar,
    user: {
      id: user.id,
      accountId: user.account_id,
      role: user.role,
      storageLimit: user.storage_limit,
      maxFileSize: user.max_file_size,
    },
  };
};

export const createDefaultWorkspace = async (
  account: SelectAccount
): Promise<WorkspaceOutput> => {
  const input: WorkspaceCreateInput = {
    name: `${account.name}'s Workspace`,
    description: 'This is your personal workspace.',
    avatar: '',
  };

  return createWorkspace(account, input);
};
