import { WorkspaceCreateInput } from '@colanode/core';
import { Request, Response } from 'express';

import { workspaceService } from '@/services/workspace-service';
import { ApiError } from '@/types/api';
import { database } from '@/data/database';

export const workspaceCreateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: WorkspaceCreateInput = req.body;

  if (!input.name) {
    res.status(400).json({
      code: ApiError.MissingRequiredFields,
      message: 'Missing required fields.',
    });
    return;
  }

  const account = await database
    .selectFrom('accounts')
    .selectAll()
    .where('id', '=', res.locals.account.id)
    .executeTakeFirst();

  if (!account) {
    res.status(404).json({
      code: ApiError.ResourceNotFound,
      message: 'Account not found.',
    });
    return;
  }

  const output = await workspaceService.createWorkspace(account, input);
  res.status(200).json(output);
};
