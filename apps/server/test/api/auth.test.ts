import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiErrorCode } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { buildTestApp } from '../helpers/app';
import {
  createAccount,
  createDevice,
  createUser,
  createWorkspace,
} from '../helpers/seed';

const app = buildTestApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /client/v1/auth/email/login', () => {
  it('returns EmailOrPasswordIncorrect for unknown email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/client/v1/auth/email/login',
      payload: {
        email: 'missing@example.com',
        password: 'nope',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.EmailOrPasswordIncorrect,
    });
  });
});

describe('token lifecycle', () => {
  it('creates a device on login and deletes it on logout', async () => {
    const account = await createAccount({
      email: 'login-user@example.com',
      password: 'Password123!',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
    });

    await createUser({
      workspaceId: workspace.id,
      account,
      role: 'owner',
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/client/v1/auth/email/login',
      payload: {
        email: account.email,
        password: 'Password123!',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    const loginBody = loginResponse.json();
    expect(loginBody).toMatchObject({
      type: 'success',
      account: { id: account.id },
    });

    const deviceId = loginBody.deviceId as string;
    const token = loginBody.token as string;

    const device = await database
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', deviceId)
      .executeTakeFirst();

    expect(device).not.toBeNull();

    const logoutResponse = await app.inject({
      method: 'DELETE',
      url: '/client/v1/auth/logout',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);

    const deletedDevice = await database
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', deviceId)
      .executeTakeFirst();

    expect(deletedDevice).toBeUndefined();

    const logoutBody = logoutResponse.json();
    expect(logoutBody).toMatchObject({});
  });

  it('rejects logout without a token', async () => {
    const logoutResponse = await app.inject({
      method: 'DELETE',
      url: '/client/v1/auth/logout',
    });

    expect(logoutResponse.statusCode).toBe(401);
    expect(logoutResponse.json()).toMatchObject({
      code: ApiErrorCode.TokenMissing,
    });
  });
});
