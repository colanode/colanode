import { Request, Response } from 'express';
import {
  AccountStatus,
  generateId,
  GoogleLoginInput,
  GoogleUserInfo,
  IdType,
} from '@colanode/core';
import axios from 'axios';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { accountService } from '@/services/account-service';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';

export const loginWithGoogleHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: GoogleLoginInput = req.body;
  const url = `${GoogleUserInfoUrl}?access_token=${input.access_token}`;
  const userInfoResponse = await axios.get(url);

  if (userInfoResponse.status !== 200) {
    res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
    return;
  }

  const googleUser: GoogleUserInfo = userInfoResponse.data;

  if (!googleUser) {
    res.status(400).json({
      code: ApiError.GoogleAuthFailed,
      message: 'Failed to authenticate with Google.',
    });
    return;
  }

  const existingAccount = await database
    .selectFrom('accounts')
    .where('email', '=', googleUser.email)
    .selectAll()
    .executeTakeFirst();

  if (existingAccount) {
    const attrs = existingAccount.attrs
      ? JSON.parse(existingAccount.attrs)
      : {};

    if (attrs?.googleId || existingAccount.status === AccountStatus.Pending) {
      await database
        .updateTable('accounts')
        .set({
          attrs: JSON.stringify({ googleId: googleUser.id }),
          updated_at: new Date(),
          status: AccountStatus.Active,
        })
        .where('id', '=', existingAccount.id)
        .execute();
    }

    const output = await accountService.buildLoginOutput(existingAccount);
    res.status(200).json(output);
  }

  const newAccount = await database
    .insertInto('accounts')
    .values({
      id: generateId(IdType.Account),
      name: googleUser.name,
      email: googleUser.email,
      status: AccountStatus.Active,
      created_at: new Date(),
      password: null,
    })
    .returningAll()
    .executeTakeFirst();

  if (!newAccount) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
    return;
  }

  const output = await accountService.buildLoginOutput(newAccount);
  res.status(200).json(output);
};
