import {
  WorkspaceUsersInviteInput,
  WorkspaceUserRoleUpdateInput,
  WorkspaceCreateInput,
  WorkspaceOutput,
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceUserStatus,
  WorkspaceUpdateInput,
  NodeOutput,
} from '@colanode/core';
import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
import {
  generateId,
  IdType,
  UserAttributes,
  WorkspaceAttributes,
  AccountStatus,
} from '@colanode/core';
import { database } from '@/data/database';
import { Router } from 'express';
import {
  CreateAccount,
  CreateNode,
  CreateWorkspaceUser,
  SelectNode,
  SelectWorkspaceUser,
} from '@/data/schema';
import { getNameFromEmail } from '@/lib/utils';
import { mapNodeOutput } from '@/lib/nodes';
import { NodeCreatedEvent, NodeUpdatedEvent } from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { YDoc } from '@colanode/crdt';

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

    const createdAt = new Date();

    const workspaceId = generateId(IdType.Workspace);
    const workspaceVersionId = generateId(IdType.Version);
    const workspaceDoc = new YDoc(workspaceId);

    const workspaceAttributes: WorkspaceAttributes = {
      type: 'workspace',
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      parentId: workspaceId,
    };

    workspaceDoc.updateAttributes(workspaceAttributes);

    const userId = generateId(IdType.User);
    const userVersionId = generateId(IdType.Version);
    const userDoc = new YDoc(userId);

    const userAttributes: UserAttributes = {
      type: 'user',
      name: account.name,
      avatar: account.avatar,
      email: account.email,
      accountId: account.id,
      role: 'owner',
      parentId: workspaceId,
    };

    userDoc.updateAttributes(userAttributes);

    await database.transaction().execute(async (trx) => {
      await trx
        .insertInto('workspaces')
        .values({
          id: workspaceId,
          name: input.name,
          description: input.description,
          avatar: input.avatar,
          created_at: createdAt,
          created_by: account.id,
          status: WorkspaceStatus.Active,
          version_id: workspaceVersionId,
        })
        .execute();

      await trx
        .insertInto('workspace_users')
        .values({
          id: userId,
          account_id: account.id,
          workspace_id: workspaceId,
          role: 'owner',
          created_at: createdAt,
          created_by: account.id,
          status: WorkspaceUserStatus.Active,
          version_id: generateId(IdType.Version),
        })
        .execute();

      await trx
        .insertInto('nodes')
        .values({
          id: workspaceId,
          workspace_id: workspaceId,
          attributes: JSON.stringify(workspaceAttributes),
          state: workspaceDoc.getState(),
          created_at: createdAt,
          created_by: account.id,
          version_id: workspaceVersionId,
          server_created_at: createdAt,
        })
        .execute();

      await trx
        .insertInto('nodes')
        .values({
          id: userId,
          workspace_id: workspaceId,
          attributes: JSON.stringify(userAttributes),
          state: userDoc.getState(),
          created_at: createdAt,
          created_by: account.id,
          version_id: userVersionId,
          server_created_at: createdAt,
        })
        .execute();
    });

    const workspaceEvent: NodeCreatedEvent = {
      type: 'node_created',
      id: workspaceId,
      workspaceId: workspaceId,
      attributes: workspaceAttributes,
      createdBy: account.id,
      createdAt: createdAt.toISOString(),
      versionId: workspaceVersionId,
      serverCreatedAt: createdAt.toISOString(),
    };

    await enqueueEvent(workspaceEvent);

    const userEvent: NodeCreatedEvent = {
      type: 'node_created',
      id: userId,
      workspaceId: workspaceId,
      attributes: userAttributes,
      createdBy: account.id,
      createdAt: createdAt.toISOString(),
      versionId: userVersionId,
      serverCreatedAt: createdAt.toISOString(),
    };

    await enqueueEvent(userEvent);

    const output: WorkspaceOutput = {
      id: workspaceId,
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      versionId: workspaceVersionId,
      user: {
        id: userId,
        accountId: account.id,
        role: 'owner',
      },
    };

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

    const existingAccounts = await database
      .selectFrom('accounts')
      .selectAll()
      .where('email', 'in', input.emails)
      .execute();

    let existingWorkspaceUsers: SelectWorkspaceUser[] = [];
    let existingUsers: SelectNode[] = [];
    if (existingAccounts.length > 0) {
      const existingAccountIds = existingAccounts.map((account) => account.id);
      existingWorkspaceUsers = await database
        .selectFrom('workspace_users')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', 'in', existingAccountIds),
            eb('workspace_id', '=', workspace.id),
          ])
        )
        .execute();
    }

    if (existingWorkspaceUsers.length > 0) {
      const existingUserIds = existingWorkspaceUsers.map(
        (workspaceAccount) => workspaceAccount.id
      );
      existingUsers = await database
        .selectFrom('nodes')
        .selectAll()
        .where('id', 'in', existingUserIds)
        .execute();
    }

    const accountsToCreate: CreateAccount[] = [];
    const workspaceUsersToCreate: CreateWorkspaceUser[] = [];
    const usersToCreate: CreateNode[] = [];

    const users: NodeOutput[] = [];
    for (const email of input.emails) {
      let account = existingAccounts.find((account) => account.email === email);

      if (!account) {
        account = {
          id: generateId(IdType.Account),
          name: getNameFromEmail(email),
          email: email,
          avatar: null,
          attrs: null,
          password: null,
          status: AccountStatus.Pending,
          created_at: new Date(),
          updated_at: null,
        };

        accountsToCreate.push({
          id: account.id,
          email: account.email,
          name: account.name,
          status: account.status,
          created_at: account.created_at,
        });
      }

      const existingWorkspaceUser = existingWorkspaceUsers.find(
        (workspaceUser) => workspaceUser.account_id === account!.id
      );

      if (existingWorkspaceUser) {
        const existingUser = existingUsers.find(
          (user) => user.id === existingWorkspaceUser.id
        );
        if (!existingUser) {
          return res.status(500).json({
            code: ApiError.InternalServerError,
            message: 'Something went wrong.',
          });
        }

        users.push(mapNodeOutput(existingUser));
        continue;
      }

      const userId = generateId(IdType.User);
      const userVersionId = generateId(IdType.Version);
      const userDoc = new YDoc(userId);

      const userAttributes: UserAttributes = {
        type: 'user',
        name: account!.name,
        avatar: account!.avatar,
        email: account!.email,
        role: input.role,
        accountId: account!.id,
        parentId: workspace.id,
      };
      userDoc.updateAttributes(userAttributes);

      workspaceUsersToCreate.push({
        id: userId,
        account_id: account!.id,
        workspace_id: workspace.id,
        role: input.role,
        created_at: new Date(),
        created_by: req.account.id,
        status: WorkspaceUserStatus.Active,
        version_id: userVersionId,
      });

      const user: NodeOutput = {
        id: userId,
        type: 'user',
        parentId: workspace.id,
        attributes: userAttributes,
        state: userDoc.getEncodedState(),
        createdAt: new Date().toISOString(),
        createdBy: workspaceUser.id,
        serverCreatedAt: new Date().toISOString(),
        versionId: userVersionId,
        workspaceId: workspace.id,
      };

      usersToCreate.push({
        id: user.id,
        attributes: JSON.stringify(userAttributes),
        state: userDoc.getState(),
        created_at: new Date(user.createdAt),
        created_by: user.createdBy,
        server_created_at: new Date(user.serverCreatedAt),
        version_id: user.versionId,
        workspace_id: user.workspaceId,
      });

      users.push(user);
    }

    if (
      accountsToCreate.length > 0 ||
      workspaceUsersToCreate.length > 0 ||
      usersToCreate.length > 0
    ) {
      await database.transaction().execute(async (trx) => {
        if (accountsToCreate.length > 0) {
          await trx.insertInto('accounts').values(accountsToCreate).execute();
        }

        if (workspaceUsersToCreate.length > 0) {
          await trx
            .insertInto('workspace_users')
            .values(workspaceUsersToCreate)
            .execute();
        }

        if (usersToCreate.length > 0) {
          await trx.insertInto('nodes').values(usersToCreate).execute();

          for (const user of usersToCreate) {
            const userEvent: NodeCreatedEvent = {
              type: 'node_created',
              id: user.id,
              workspaceId: user.workspace_id,
              attributes: JSON.parse(user.attributes ?? '{}'),
              createdBy: user.created_by,
              createdAt: user.created_at.toISOString(),
              serverCreatedAt: user.server_created_at.toISOString(),
              versionId: user.version_id,
            };

            await enqueueEvent(userEvent);
          }
        }
      });
    }

    return res.status(200).json({
      users: users,
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

    const attributes = user.attributes;
    if (attributes.type !== 'user') {
      return res.status(400).json({
        code: ApiError.BadRequest,
        message: 'BadRequest.',
      });
    }

    const updatedAt = new Date();
    const userDoc = new YDoc(user.id, user.state);
    userDoc.updateAttributes({
      ...attributes,
      role: input.role,
    });

    const userNode: NodeOutput = {
      id: user.id,
      type: user.type,
      workspaceId: user.workspace_id,
      parentId: workspace.id,
      attributes: userDoc.getAttributes(),
      state: userDoc.getEncodedState(),
      createdAt: user.created_at.toISOString(),
      createdBy: user.created_by,
      serverCreatedAt: user.server_created_at.toISOString(),
      serverUpdatedAt: updatedAt.toISOString(),
      versionId: generateId(IdType.Version),
      updatedAt: updatedAt.toISOString(),
      updatedBy: currentWorkspaceUser.id,
    };

    await database.transaction().execute(async (trx) => {
      await trx
        .updateTable('workspace_users')
        .set({
          role: input.role,
          updated_at: new Date(),
          updated_by: currentWorkspaceUser.account_id,
          version_id: generateId(IdType.Version),
        })
        .where('id', '=', userId)
        .execute();

      await trx
        .updateTable('nodes')
        .set({
          attributes: JSON.stringify(userDoc.getAttributes()),
          state: userDoc.getState(),
          server_updated_at: updatedAt,
          updated_at: updatedAt,
          updated_by: currentWorkspaceUser.id,
          version_id: userNode.versionId,
        })
        .where('id', '=', userNode.id)
        .execute();
    });

    const event: NodeUpdatedEvent = {
      type: 'node_updated',
      id: userNode.id,
      workspaceId: userNode.workspaceId,
      beforeAttributes: attributes,
      afterAttributes: userDoc.getAttributes(),
      updatedBy: currentWorkspaceUser.id,
      updatedAt: updatedAt.toISOString(),
      serverUpdatedAt: updatedAt.toISOString(),
      versionId: userNode.versionId,
    };

    await enqueueEvent(event);

    return res.status(200).json({
      user: userNode,
    });
  }
);
