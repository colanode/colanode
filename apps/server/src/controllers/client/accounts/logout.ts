import { Request, Response } from 'express';

import { database } from '@/data/database';

export const logoutHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const account = res.locals.account;

  await database
    .deleteFrom('devices')
    .where('id', '=', account.deviceId)
    .execute();

  res.status(200).end();
};
