import {
  AccountStatus,
  AccountSyncOutput,
  AccountUpdateInput,
  AccountUpdateOutput,
  EmailLoginInput,
  EmailRegisterInput,
  generateId,
  GoogleLoginInput,
  GoogleUserInfo,
  IdType,
  LoginOutput,
  WorkspaceOutput,
  WorkspaceRole,
} from '@colanode/core';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { Request, Response, Router } from 'express';
import { sha256 } from 'js-sha256';

import { database } from '@/data/database';
import { SelectAccount } from '@/data/schema';
import { generateToken } from '@/lib/tokens';
import { authMiddleware } from '@/middlewares/auth';
import { nodeService } from '@/services/node-service';
import { workspaceService } from '@/services/workspace-service';
import { ApiError } from '@/types/api';

const GoogleUserInfoUrl = 'https://www.googleapis.com/oauth2/v1/userinfo';
const SaltRounds = 10;

export const accountsRouter = Router();

accountsRouter.post('/register/email', async (req: Request, res: Response) => {
  const input: EmailRegisterInput = req.body;
  const email = input.email.toLowerCase();

  const existingAccount = await database
    .selectFrom('accounts')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();

  const salt = await bcrypt.genSalt(SaltRounds);
  const preHashedPassword = sha256(input.password);
  const password = await bcrypt.hash(preHashedPassword, salt);

  let account: SelectAccount | null | undefined = null;
  if (existingAccount) {
    if (existingAccount.status !== AccountStatus.Pending) {
      res.status(400).json({
        code: ApiError.EmailAlreadyExists,
        message: 'Email already exists.',
      });
      return;
    }

    account = await database
      .updateTable('accounts')
      .set({
        password: password,
        name: input.name,
        updated_at: new Date(),
        status: AccountStatus.Active,
      })
      .where('id', '=', existingAccount.id)
      .returningAll()
      .executeTakeFirst();
  } else {
    account = await database
      .insertInto('accounts')
      .values({
        id: generateId(IdType.Account),
        name: input.name,
        email: email,
        password: password,
        status: AccountStatus.Active,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  }

  if (!account) {
    res.status(500).json({
      code: ApiError.InternalServerError,
      message: 'Failed to create account.',
    });
    return;
  }

  const output = await buildLoginOutput(account);
  res.status(200).json(output);
});

accountsRouter.post('/login/email', async (req: Request, res: Response) => {
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

  const output = await buildLoginOutput(account);
  res.status(200).json(output);
});

accountsRouter.post('/login/google', async (req: Request, res: Response) => {
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

    const output = await buildLoginOutput(existingAccount);
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

  const output = await buildLoginOutput(newAccount);
  res.status(200).json(output);
});

accountsRouter.delete(
  '/logout',
  authMiddleware,
  async (req: Request, res: Response) => {
    const account = res.locals.account;
    if (!account) {
      res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
      return;
    }

    await database
      .deleteFrom('devices')
      .where('id', '=', account.deviceId)
      .execute();

    res.status(200).end();
  }
);

accountsRouter.put(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const input: AccountUpdateInput = req.body;

    if (!res.locals.account) {
      res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
      return;
    }

    if (id !== res.locals.account.id) {
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
  }
);

accountsRouter.get(
  '/sync',
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!res.locals.account) {
      res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
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
  }
);

const buildLoginOutput = async (
  account: SelectAccount
): Promise<LoginOutput> => {
  const workspaceUsers = await database
    .selectFrom('workspace_users')
    .where('account_id', '=', account.id)
    .selectAll()
    .execute();

  const workspaceOutputs: WorkspaceOutput[] = [];
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

  if (workspaceOutputs.length === 0) {
    const workspace = await workspaceService.createDefaultWorkspace(account);
    workspaceOutputs.push(workspace);
  }

  const deviceId = generateId(IdType.Device);
  const { token, salt, hash } = generateToken(deviceId);

  const device = await database
    .insertInto('devices')
    .values({
      id: deviceId,
      account_id: account.id,
      token_hash: hash,
      token_salt: salt,
      token_generated_at: new Date(),
      type: 1,
      created_at: new Date(),
      version: '0.1.0',
    })
    .returningAll()
    .executeTakeFirst();

  if (!device) {
    throw new Error('Failed to create device.');
  }

  return {
    account: {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar,
    },
    workspaces: workspaceOutputs,
    deviceId: device.id,
    token,
  };
};
