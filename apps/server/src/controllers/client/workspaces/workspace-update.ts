import { Request, Response } from 'express';
import { WorkspaceOutput, WorkspaceUpdateInput } from '@colanode/core';

import { database } from '@/data/database';
import { nodeService } from '@/services/node-service';
import { ApiError } from '@/types/api';

export const workspaceUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;
  const input: WorkspaceUpdateInput = req.body;

  if (res.locals.workspaceUser.role !== 'owner') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  const updatedWorkspace = await database
    .updateTable('workspaces')
    .set({
      name: input.name,
      description: input.description,
      avatar: input.avatar,
      updated_at: new Date(),
      updated_by: res.locals.account.id,
    })
    .where('id', '=', workspaceId)
    .returningAll()
    .executeTakeFirst();

  if (!updatedWorkspace) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Internal server error.',
    });
    return;
  }

  await nodeService.updateNode({
    nodeId: updatedWorkspace.id,
    userId: res.locals.account.id,
    workspaceId: workspaceId,
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
      id: res.locals.workspaceUser.id,
      accountId: res.locals.workspaceUser.account_id,
      role: res.locals.workspaceUser.role,
    },
  };

  res.status(200).json(output);
};
