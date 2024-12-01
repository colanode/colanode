import {
  generateId,
  IdType,
  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceStatus,
  WorkspaceUserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { mapNode } from '@/lib/nodes';
import { nodeService } from '@/services/node-service';

class WorkspaceService {
  public async createWorkspace(
    account: SelectAccount,
    input: WorkspaceCreateInput
  ): Promise<WorkspaceOutput> {
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
        version_id: generateId(IdType.Version),
      })
      .returningAll()
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Failed to create workspace.');
    }

    const workspaceUser = await database
      .insertInto('workspace_users')
      .values({
        id: userId,
        account_id: account.id,
        workspace_id: workspaceId,
        role: 'owner',
        created_at: date,
        created_by: account.id,
        status: WorkspaceUserStatus.Active,
        version_id: generateId(IdType.Version),
      })
      .returningAll()
      .executeTakeFirst();

    if (!workspaceUser) {
      throw new Error('Failed to create workspace user.');
    }

    const createWorkspaceNodeOutput = await nodeService.createNode({
      nodeId: workspaceId,
      attributes: {
        type: 'workspace',
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        parentId: workspaceId,
      },
      userId: userId,
      workspaceId: workspaceId,
      ancestors: [],
    });

    if (!createWorkspaceNodeOutput) {
      throw new Error('Failed to create workspace node.');
    }

    await nodeService.createNode({
      nodeId: userId,
      attributes: {
        type: 'user',
        name: account.name,
        email: account.email,
        role: 'owner',
        accountId: account.id,
        parentId: workspaceId,
      },
      userId: userId,
      workspaceId: workspaceId,
      ancestors: [],
    });

    const createSpaceNodeOutput = await nodeService.createNode({
      nodeId: spaceId,
      attributes: {
        type: 'space',
        name: 'Home',
        description: 'This is your home space.',
        parentId: workspaceId,
        collaborators: {
          [userId]: 'admin',
        },
      },
      userId: userId,
      workspaceId: workspaceId,
      ancestors: [],
    });

    if (createSpaceNodeOutput) {
      const spaceNode = mapNode(createSpaceNodeOutput.node);
      await nodeService.createNode({
        nodeId: generateId(IdType.Page),
        attributes: {
          type: 'page',
          name: 'Notes',
          parentId: spaceId,
          content: {},
        },
        userId: userId,
        workspaceId: workspaceId,
        ancestors: [spaceNode],
      });

      await nodeService.createNode({
        nodeId: generateId(IdType.Channel),
        attributes: {
          type: 'channel',
          name: 'Discussions',
          parentId: spaceId,
        },
        userId: userId,
        workspaceId: workspaceId,
        ancestors: [spaceNode],
      });
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      user: {
        id: workspaceUser.id,
        accountId: workspaceUser.account_id,
        role: workspaceUser.role,
      },
    };
  }

  public async createDefaultWorkspace(account: SelectAccount) {
    const input: WorkspaceCreateInput = {
      name: `${account.name}'s Workspace`,
      description: 'This is your personal workspace.',
      avatar: '',
    };

    return this.createWorkspace(account, input);
  }
}

export const workspaceService = new WorkspaceService();
