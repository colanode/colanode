import { Request, Response } from 'express';
import {
  AccountStatus,
  generateId,
  IdType,
  WorkspaceUserInviteResult,
  WorkspaceUsersInviteInput,
  WorkspaceUserStatus,
} from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { fetchNode, mapNode } from '@/lib/nodes';
import { getNameFromEmail } from '@/lib/utils';
import { nodeService } from '@/services/node-service';
import { SelectWorkspaceUser } from '@/data/schema';

export const userCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: WorkspaceUsersInviteInput = req.body;
  const workspaceUser: SelectWorkspaceUser = res.locals.workspaceUser;

  if (!input.emails || input.emails.length === 0) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'BadRequest.',
    });
    return;
  }

  if (!res.locals.account) {
    res.status(401).json({
      code: ApiError.Unauthorized,
      message: 'Unauthorized.',
    });
    return;
  }

  if (workspaceUser.role !== 'owner' && workspaceUser.role !== 'admin') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const workspaceNodeRow = await fetchNode(workspaceId);
  if (!workspaceNodeRow) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Something went wrong.',
    });
    return;
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
      .where('workspace_id', '=', workspaceId)
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
        workspace_id: workspaceId,
        role: input.role,
        created_at: new Date(),
        created_by: res.locals.account.id,
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
        parentId: workspaceId,
      },
      userId: workspaceUser.id,
      workspaceId: workspaceId,
      ancestors: [workspaceNode],
    });

    results.push({
      email: email,
      result: 'success',
    });
  }

  res.status(200).json({
    results: results,
  });
};
