import { Request, Response } from 'express';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';

export const workspaceDeleteHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const workspaceId = req.params.workspaceId as string;

  if (res.locals.workspaceUser.role !== 'owner') {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  await database
    .deleteFrom('workspaces')
    .where('id', '=', workspaceId)
    .execute();

  res.status(200).json({
    id: res.locals.workspace.id,
  });
};
