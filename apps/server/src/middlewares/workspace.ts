import { NextFunction, Request, RequestHandler, Response } from 'express';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';

export const workspaceMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const workspaceId = req.params.workspaceId as string;

  const workspaceUser = await database
    .selectFrom('workspace_users')
    .selectAll()
    .where('workspace_id', '=', workspaceId)
    .where('account_id', '=', res.locals.account.id)
    .executeTakeFirst();

  if (!workspaceUser) {
    res.status(403).json({
      code: ApiError.Forbidden,
      message: 'Forbidden.',
    });
    return;
  }

  res.locals.workspaceUser = workspaceUser;

  next();
};
