import { Request, Response } from 'express';
import { AccountUpdateInput, AccountUpdateOutput } from '@colanode/core';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { nodeService } from '@/services/node-service';

export const accountUpdateHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const accountId = req.params.accountId;
  const input: AccountUpdateInput = req.body;

  if (accountId !== res.locals.account.id) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Invalid account id.',
    });
    return;
  }

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

  const nameChanged = account.name !== input.name;
  const avatarChanged = account.avatar !== input.avatar;

  if (!nameChanged && !avatarChanged) {
    res.status(400).json({
      code: ApiError.BadRequest,
      message: 'Nothing to update.',
    });
    return;
  }

  await database
    .updateTable('accounts')
    .set({
      name: input.name,
      avatar: input.avatar,
      updated_at: new Date(),
    })
    .where('id', '=', account.id)
    .execute();

  const users = await database
    .selectFrom('nodes')
    .selectAll()
    .where(
      'id',
      'in',
      database
        .selectFrom('workspace_users')
        .select('id')
        .where('account_id', '=', account.id)
    )
    .execute();

  for (const user of users) {
    if (user.attributes.type !== 'user') {
      throw new Error('User node not found.');
    }

    const name = user.attributes.name ?? null;
    const avatar = user.attributes.avatar ?? null;

    if (account.name !== name || account.avatar !== avatar) {
      continue;
    }

    await nodeService.updateNode({
      nodeId: user.id,
      userId: user.created_by,
      workspaceId: user.workspace_id,
      updater: (attributes) => {
        if (attributes.type !== 'user') {
          return null;
        }

        return {
          ...attributes,
          name: input.name,
          avatar: input.avatar,
        };
      },
    });
  }

  const output: AccountUpdateOutput = {
    id: account.id,
    name: input.name,
    avatar: input.avatar,
  };

  res.status(200).json(output);
};
