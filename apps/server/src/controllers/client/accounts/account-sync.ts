import { Request, Response } from 'express';
import {
  AccountSyncOutput,
  WorkspaceOutput,
  WorkspaceRole,
} from '@colanode/core';

import { ApiError } from '@/types/api';
import { database } from '@/data/database';

export const accountSyncHandler = async (
  _: Request,
  res: Response
): Promise<void> => {
  const account = await database
    .selectFrom('accounts')
    .where('id', '=', res.locals.account.id)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Account not found.',
    });
    return;
  }

  const workspaceOutputs: WorkspaceOutput[] = [];
  const workspaceUsers = await database
    .selectFrom('workspace_users')
    .where('account_id', '=', account.id)
    .selectAll()
    .execute();

  if (workspaceUsers.length > 0) {
    const workspaceIds = workspaceUsers.map((wu) => wu.workspace_id);
    const workspaces = await database
      .selectFrom('workspaces')
      .where('id', 'in', workspaceIds)
      .selectAll()
      .execute();

    for (const workspaceUser of workspaceUsers) {
      const workspace = workspaces.find(
        (w) => w.id === workspaceUser.workspace_id
      );

      if (!workspace) {
        continue;
      }

      workspaceOutputs.push({
        id: workspace.id,
        name: workspace.name,
        versionId: workspaceUser.version_id,
        avatar: workspace.avatar,
        description: workspace.description,
        user: {
          id: workspaceUser.id,
          accountId: workspaceUser.account_id,
          role: workspaceUser.role as WorkspaceRole,
        },
      });
    }
  }

  const output: AccountSyncOutput = {
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    },
    workspaces: workspaceOutputs,
  };

  res.status(200).json(output);
};
