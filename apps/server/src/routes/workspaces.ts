import {
 AccountStatus,generateId, IdType,  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceRole,
  WorkspaceUpdateInput,
  WorkspaceUserInviteResult,
  WorkspaceUserRoleUpdateInput,
  WorkspaceUsersInviteInput,
  WorkspaceUserStatus } from '@colanode/core';
import { Router } from 'express';

import { database } from '@/data/database';
import { fetchNode, mapNode, mapNodeTransaction } from '@/lib/nodes';
import { getNameFromEmail } from '@/lib/utils';
import { nodeService } from '@/services/node-service';
import { workspaceService } from '@/services/workspace-service';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';

export const workspacesRouter = Router();

workspacesRouter.post(
  '/',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const input: WorkspaceCreateInput = req.body;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    if (!input.name) {
      return res.status(400).json({
        code: ApiError.MissingRequiredFields,
        message: 'Missing required fields.',
      });
    }

    const account = await database
      .selectFrom('accounts')
      .selectAll()
      .where('id', '=', req.account.id)
      .executeTakeFirst();

    if (!account) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Account not found.',
      });
    }

    const output = await workspaceService.createWorkspace(account, input);
    return res.status(200).json(output);
  }
);

workspacesRouter.put(
  '/:id',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id as string;
    const input: WorkspaceUpdateInput = req.body;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== 'owner') {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const updatedWorkspace = await database
      .updateTable('workspaces')
      .set({
        name: input.name,
        description: input.description,
        avatar: input.avatar,
        updated_at: new Date(),
        updated_by: req.account.id,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedWorkspace) {
      return res.status(500).json({
        code: ApiError.InternalServerError,
        message: 'Internal server error.',
      });
    }

    await nodeService.updateNode({
      nodeId: updatedWorkspace.id,
      userId: req.account.id,
      workspaceId: id,
      updater: (attributes) => {
        if (attributes.type !== 'workspace') {
          return null;
        }

        attributes.name = input.name;
        attributes.description = input.description;
        attributes.avatar = input.avatar;

        return attributes;
      },
    });

    const output: WorkspaceOutput = {
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      description: updatedWorkspace.description,
      avatar: updatedWorkspace.avatar,
      versionId: updatedWorkspace.version_id,
      user: {
        id: workspaceUser.id,
        accountId: workspaceUser.account_id,
        role: workspaceUser.role,
      },
    };

    return res.status(200).json(output);
  }
);

workspacesRouter.delete(
  '/:id',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== 'owner') {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    await database.deleteFrom('workspaces').where('id', '=', id).execute();

    return res.status(200).json({
      id: workspace.id,
    });
  }
);

workspacesRouter.get(
  '/:id',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id as string;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const output: WorkspaceOutput = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      avatar: workspace.avatar,
      versionId: workspace.version_id,
      user: {
        id: workspaceUser.id,
        accountId: workspaceUser.account_id,
        role: workspaceUser.role as WorkspaceRole,
      },
    };

    return res.status(200).json(output);
  }
);

workspacesRouter.get(
  '/',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspaceUsers = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('account_id', '=', req.account.id)
      .execute();

    const workspaceIds = workspaceUsers.map((wa) => wa.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', 'in', workspaceIds)
      .execute();

    const outputs: WorkspaceOutput[] = [];
    for (const workspace of workspaces) {
      const workspaceUser = workspaceUsers.find(
        (wa) => wa.workspace_id === workspace.id
      );

      if (!workspaceUser) {
        continue;
      }

      const output: WorkspaceOutput = {
        id: workspace.id,
        name: workspace.name,
        description: workspace.description,
        avatar: workspace.avatar,
        versionId: workspace.version_id,
        user: {
          id: workspaceUser.id,
          accountId: workspaceUser.account_id,
          role: workspaceUser.role as WorkspaceRole,
        },
      };

      outputs.push(output);
    }

    return res.status(200).json(outputs);
  }
);

workspacesRouter.post(
  '/:id/users',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id as string;
    const input: WorkspaceUsersInviteInput = req.body;

    if (!input.emails || input.emails.length === 0) {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'BadRequest.',
      });
    }

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (workspaceUser.role !== 'owner' && workspaceUser.role !== 'admin') {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const workspaceNodeRow = await fetchNode(workspace.id);
    if (!workspaceNodeRow) {
      return res.status(500).json({
        code: ApiError.InternalServerError,
        message: 'Something went wrong.',
      });
    }

    const workspaceNode = mapNode(workspaceNodeRow);
    const results: WorkspaceUserInviteResult[] = [];
    for (const email of input.emails) {
      let account = await database
        .selectFrom('accounts')
        .select(['id', 'name', 'email', 'avatar'])
        .where('email', '=', email)
        .executeTakeFirst();

      if (!account) {
        account = await database
          .insertInto('accounts')
          .returning(['id', 'name', 'email', 'avatar'])
          .values({
            id: generateId(IdType.Account),
            name: getNameFromEmail(email),
            email: email,
            avatar: null,
            attrs: null,
            password: null,
            status: AccountStatus.Pending,
            created_at: new Date(),
            updated_at: null,
          })
          .executeTakeFirst();
      }

      if (!account) {
        results.push({
          email: email,
          result: 'error',
        });
        continue;
      }

      const existingWorkspaceUser = await database
        .selectFrom('workspace_users')
        .selectAll()
        .where('account_id', '=', account.id)
        .where('workspace_id', '=', id)
        .executeTakeFirst();

      if (existingWorkspaceUser) {
        results.push({
          email: email,
          result: 'exists',
        });
        continue;
      }

      const userId = generateId(IdType.User);
      const newWorkspaceUser = await database
        .insertInto('workspace_users')
        .returningAll()
        .values({
          id: userId,
          account_id: account.id,
          workspace_id: id,
          role: input.role,
          created_at: new Date(),
          created_by: req.account.id,
          status: WorkspaceUserStatus.Active,
          version_id: generateId(IdType.Version),
        })
        .executeTakeFirst();

      if (!newWorkspaceUser) {
        results.push({
          email: email,
          result: 'error',
        });
      }

      await nodeService.createNode({
        nodeId: userId,
        attributes: {
          type: 'user',
          name: account.name,
          email: account.email,
          role: input.role,
          accountId: account.id,
          parentId: id,
        },
        userId: workspaceUser.id,
        workspaceId: id,
        ancestors: [workspaceNode],
      });

      results.push({
        email: email,
        result: 'success',
      });
    }

    return res.status(200).json({
      results: results,
    });
  }
);

workspacesRouter.put(
  '/:id/users/:userId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
    const id = req.params.id as string;
    const userId = req.params.userId as string;
    const input: WorkspaceUserRoleUpdateInput = req.body;

    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const currentWorkspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!currentWorkspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    if (
      currentWorkspaceUser.role !== 'owner' &&
      currentWorkspaceUser.role !== 'admin'
    ) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const workspaceUserToUpdate = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!workspaceUserToUpdate) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'NotFound.',
      });
    }

    const user = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', workspaceUserToUpdate.id)
      .executeTakeFirst();

    if (!user) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'NotFound.',
      });
    }

    await database
      .updateTable('workspace_users')
      .set({
        role: input.role,
        updated_at: new Date(),
        updated_by: currentWorkspaceUser.account_id,
        version_id: generateId(IdType.Version),
      })
      .where('id', '=', userId)
      .execute();

    const updateUserOutput = await nodeService.updateNode({
      nodeId: user.id,
      userId: currentWorkspaceUser.account_id,
      workspaceId: workspace.id,
      updater: (attributes) => {
        if (attributes.type !== 'user') {
          return null;
        }

        attributes.role = input.role;
        return attributes;
      },
    });

    if (!updateUserOutput) {
      return res.status(500).json({
        code: ApiError.InternalServerError,
        message: 'Something went wrong.',
      });
    }

    return res.status(200).json({
      transaction: mapNodeTransaction(updateUserOutput.transaction),
    });
  }
);
