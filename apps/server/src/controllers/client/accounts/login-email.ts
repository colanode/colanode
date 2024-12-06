import { Request, Response } from 'express';
import { AccountStatus, EmailLoginInput } from '@colanode/core';
import bcrypt from 'bcrypt';
import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { ApiError } from '@/types/api';
import { accountService } from '@/services/account-service';

export const loginWithEmailHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const input: EmailLoginInput = req.body;
  const email = input.email.toLowerCase();

  const account = await database
    .selectFrom('accounts')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();

  if (!account) {
    res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
    return;
  }

  if (account.status === AccountStatus.Pending) {
    res.status(400).json({
      code: ApiError.UserPendingActivation,
      message: 'User is pending activation.',
    });
    return;
  }

  if (!account.password) {
    res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
    return;
  }

  const preHashedPassword = sha256(input.password);
  const passwordMatch = await bcrypt.compare(
    preHashedPassword,
    account.password
  );

  if (!passwordMatch) {
    res.status(400).json({
      code: ApiError.EmailOrPasswordIncorrect,
      message: 'Invalid credentials.',
    });
    return;
  }

  const output = await accountService.buildLoginOutput(account);
  res.status(200).json(output);
};
