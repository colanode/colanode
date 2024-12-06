import { Request, Response } from 'express';
import {
  generateId,
  IdType,
  WorkspaceUserRoleUpdateInput,
} from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { nodeService } from '@/services/node-service';
import { mapTransaction } from '@/lib/nodes';
import { SelectWorkspaceUser } from '@/data/schema';

export const userRoleUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const userId = req.params.userId as string;
  const input: WorkspaceUserRoleUpdateInput = req.body;
  const workspaceUser: SelectWorkspaceUser = res.locals.workspaceUser;

  if (workspaceUser.role !== 'owner' && workspaceUser.role !== 'admin') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const workspaceUserToUpdate = await database
    .selectFrom('workspace_users')
    .selectAll()
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!workspaceUserToUpdate) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'NotFound.',
    });
    return;
  }

  const user = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', workspaceUserToUpdate.id)
    .executeTakeFirst();

  if (!user) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'NotFound.',
    });
    return;
  }

  await database
    .updateTable('workspace_users')
    .set({
      role: input.role,
      updated_at: new Date(),
      updated_by: workspaceUser.account_id,
      version_id: generateId(IdType.Version),
    })
    .where('id', '=', userId)
    .execute();

  const updateUserOutput = await nodeService.updateNode({
    nodeId: user.id,
    userId: workspaceUser.account_id,
    workspaceId: workspaceId,
    updater: (attributes) => {
      if (attributes.type !== 'user') {
        return null;
      }

      attributes.role = input.role;
      return attributes;
    },
  });

  if (!updateUserOutput) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Something went wrong.',
    });
    return;
  }

  res.status(200).json({
    transaction: mapTransaction(updateUserOutput.transaction),
  });
};
