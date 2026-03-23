import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ApiErrorCode,
  IdType,
  UserStatus,
  WorkspaceStatus,
  generateId,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { buildTestApp } from '../helpers/app';
import {
  buildAuthHeader,
  buildCreateNodeMutation,
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

describe('workspace access', () => {
  it('rejects users with role none', async () => {
    const account = await createAccount({
      email: 'no-role@example.com',
      password: 'Password123!',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
      status: WorkspaceStatus.Active,
    });

    await createUser({
      workspaceId: workspace.id,
      account,
      role: 'none',
    });

    const { token } = await createDevice({ accountId: account.id });

    const response = await app.inject({
      method: 'GET',
      url: `/client/v1/workspaces/${workspace.id}`,
      headers: buildAuthHeader(token),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.WorkspaceNoAccess,
    });
  });
});

describe('workspace readonly guard', () => {
  it('rejects mutations when workspace is not active (readonly)', async () => {
    const account = await createAccount({
      email: 'readonly@example.com',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
      status: WorkspaceStatus.Readonly,
    });

    const user = await createUser({
      workspaceId: workspace.id,
      account,
      role: 'owner',
    });

    const { token } = await createDevice({ accountId: account.id });

    const mutation = buildCreateNodeMutation({
      nodeId: generateId(IdType.Space),
      attributes: {
        type: 'space',
        name: 'Readonly Space',
        visibility: 'private',
        collaborators: {
          [user.id]: 'admin',
        },
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/mutations`,
      headers: buildAuthHeader(token),
      payload: {
        mutations: [mutation],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.WorkspaceNoAccess,
    });
  });
});

describe('workspace user invites', () => {
  it('rejects invites from non-admin roles', async () => {
    const account = await createAccount({
      email: 'invite@example.com',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
    });

    await createUser({
      workspaceId: workspace.id,
      account,
      role: 'guest',
    });

    const { token } = await createDevice({ accountId: account.id });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/users`,
      headers: buildAuthHeader(token),
      payload: {
        users: [
          {
            email: 'new-user@example.com',
            role: 'collaborator',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.UserInviteNoAccess,
    });
  });
});

describe('workspace role updates', () => {
  it('rejects role updates from non-admin users', async () => {
    const account = await createAccount({
      email: 'role-update@example.com',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
    });

    await createUser({
      workspaceId: workspace.id,
      account,
      role: 'guest',
    });

    const targetAccount = await createAccount({
      email: 'role-target@example.com',
    });

    const targetUser = await createUser({
      workspaceId: workspace.id,
      account: targetAccount,
      role: 'collaborator',
    });

    const { token } = await createDevice({ accountId: account.id });

    const response = await app.inject({
      method: 'PATCH',
      url: `/client/v1/workspaces/${workspace.id}/users/${targetUser.id}/role`,
      headers: buildAuthHeader(token),
      payload: {
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.UserUpdateNoAccess,
    });
  });

  it('sets status to Removed when role is none', async () => {
    const ownerAccount = await createAccount({
      email: 'role-owner@example.com',
    });

    const workspace = await createWorkspace({
      createdBy: ownerAccount.id,
    });

    await createUser({
      workspaceId: workspace.id,
      account: ownerAccount,
      role: 'owner',
    });

    const memberAccount = await createAccount({
      email: 'role-member@example.com',
    });

    const memberUser = await createUser({
      workspaceId: workspace.id,
      account: memberAccount,
      role: 'collaborator',
    });

    const { token } = await createDevice({ accountId: ownerAccount.id });

    const response = await app.inject({
      method: 'PATCH',
      url: `/client/v1/workspaces/${workspace.id}/users/${memberUser.id}/role`,
      headers: buildAuthHeader(token),
      payload: {
        role: 'none',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { status: number; role: string };
    expect(body.role).toBe('none');
    expect(body.status).toBe(UserStatus.Removed);

    const updatedUser = await database
      .selectFrom('users')
      .selectAll()
      .where('id', '=', memberUser.id)
      .executeTakeFirst();

    expect(updatedUser?.status).toBe(UserStatus.Removed);
    expect(updatedUser?.role).toBe('none');
  });
});

describe('workspace role update security', () => {
  it('rejects cross-workspace role update', async () => {
    const adminAccount = await createAccount({
      email: 'cross-ws-admin@example.com',
    });
    const workspaceA = await createWorkspace({ createdBy: adminAccount.id });
    await createUser({
      workspaceId: workspaceA.id,
      account: adminAccount,
      role: 'admin',
    });
    const { token: adminToken } = await createDevice({
      accountId: adminAccount.id,
    });

    const ownerBAccount = await createAccount({
      email: 'cross-ws-owner-b@example.com',
    });
    const workspaceB = await createWorkspace({ createdBy: ownerBAccount.id });
    const targetUser = await createUser({
      workspaceId: workspaceB.id,
      account: ownerBAccount,
      role: 'collaborator',
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/client/v1/workspaces/${workspaceA.id}/users/${targetUser.id}/role`,
      headers: buildAuthHeader(adminToken),
      payload: { role: 'guest' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      code: ApiErrorCode.UserNotFound,
    });
  });
});

describe('workspace invite role restrictions', () => {
  it('rejects invite with none role', async () => {
    const ownerAccount = await createAccount({
      email: 'invite-none-owner@example.com',
    });
    const workspace = await createWorkspace({ createdBy: ownerAccount.id });
    await createUser({
      workspaceId: workspace.id,
      account: ownerAccount,
      role: 'owner',
    });
    const { token } = await createDevice({ accountId: ownerAccount.id });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/users`,
      headers: buildAuthHeader(token),
      payload: {
        users: [{ email: 'none-role@example.com', role: 'none' }],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].error).toContain('none');
  });

  it('rejects admin inviting as owner', async () => {
    const adminAccount = await createAccount({
      email: 'invite-admin-owner@example.com',
    });
    const workspace = await createWorkspace({ createdBy: adminAccount.id });
    await createUser({
      workspaceId: workspace.id,
      account: adminAccount,
      role: 'admin',
    });
    const { token } = await createDevice({ accountId: adminAccount.id });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/users`,
      headers: buildAuthHeader(token),
      payload: {
        users: [{ email: 'new-owner@example.com', role: 'owner' }],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].error).toContain('Only owners');
  });

  it('rejects admin inviting as admin', async () => {
    const adminAccount = await createAccount({
      email: 'invite-admin-admin@example.com',
    });
    const workspace = await createWorkspace({ createdBy: adminAccount.id });
    await createUser({
      workspaceId: workspace.id,
      account: adminAccount,
      role: 'admin',
    });
    const { token } = await createDevice({ accountId: adminAccount.id });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/users`,
      headers: buildAuthHeader(token),
      payload: {
        users: [{ email: 'new-admin@example.com', role: 'admin' }],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].error).toContain('Only owners');
  });

  it('allows owner to invite as collaborator', async () => {
    const ownerAccount = await createAccount({
      email: 'invite-owner-collab@example.com',
    });
    const workspace = await createWorkspace({ createdBy: ownerAccount.id });
    await createUser({
      workspaceId: workspace.id,
      account: ownerAccount,
      role: 'owner',
    });
    const { token } = await createDevice({ accountId: ownerAccount.id });

    // Pre-create the target account and user so the invite returns
    // the existing user without trying to send an invitation email.
    const targetAccount = await createAccount({
      email: 'new-collab-ok@example.com',
    });
    await createUser({
      workspaceId: workspace.id,
      account: targetAccount,
      role: 'collaborator',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/users`,
      headers: buildAuthHeader(token),
      payload: {
        users: [{ email: 'new-collab-ok@example.com', role: 'collaborator' }],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errors).toHaveLength(0);
    expect(body.users).toHaveLength(1);
  });
});
