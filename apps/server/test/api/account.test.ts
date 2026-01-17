import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ApiHeader, UserStatus } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { buildTestApp } from '../helpers/app';
import {
  buildAuthHeader,
  createAccount,
  createDevice,
  createUser,
  createWorkspace,
} from '../helpers/seed';

const CLIENT_PLATFORM = 'test-platform';
const CLIENT_VERSION = '1.2.3';
const CLIENT_TYPE = 'web';
const CLIENT_IP = '203.0.113.10';

const app = buildTestApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /client/v1/accounts/sync', () => {
  it('returns only active workspaces and updates device metadata', async () => {
    const account = await createAccount({
      email: 'sync@example.com',
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

    const hiddenWorkspace = await createWorkspace({
      createdBy: account.id,
      name: 'Hidden Workspace',
    });

    await createUser({
      workspaceId: hiddenWorkspace.id,
      account,
      role: 'none',
    });

    const removedWorkspace = await createWorkspace({
      createdBy: account.id,
      name: 'Removed Workspace',
    });

    await createUser({
      workspaceId: removedWorkspace.id,
      account,
      role: 'collaborator',
      status: UserStatus.Removed,
    });

    const { device, token } = await createDevice({ accountId: account.id });

    const response = await app.inject({
      method: 'POST',
      url: '/client/v1/accounts/sync',
      headers: {
        ...buildAuthHeader(token),
        [ApiHeader.ClientPlatform]: CLIENT_PLATFORM,
        [ApiHeader.ClientVersion]: CLIENT_VERSION,
        [ApiHeader.ClientType]: CLIENT_TYPE,
        'x-forwarded-for': CLIENT_IP,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as {
      account: { id: string };
      workspaces: { id: string }[];
    };

    expect(body.account.id).toBe(account.id);
    expect(body.workspaces).toHaveLength(1);
    expect(body.workspaces[0]?.id).toBe(workspace.id);

    const updatedDevice = await database
      .selectFrom('devices')
      .selectAll()
      .where('id', '=', device.id)
      .executeTakeFirst();

    expect(updatedDevice?.synced_at).not.toBeNull();
    expect(updatedDevice?.platform).toBe(CLIENT_PLATFORM);
    expect(updatedDevice?.version).toBe(CLIENT_VERSION);
    expect(updatedDevice?.ip).toBe(CLIENT_IP);
  });
});
