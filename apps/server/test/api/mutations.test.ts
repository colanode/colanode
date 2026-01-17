import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { IdType, MutationStatus, generateId } from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { jobService } from '@colanode/server/services/job-service';
import { buildTestApp } from '../helpers/app';
import {
  buildAuthHeader,
  buildCreateNodeMutation,
  createAccount,
  createDevice,
  createPageNode,
  createSpaceNode,
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

describe('mutation idempotency', () => {
  it('returns CREATED then OK for repeated node.create', async () => {
    const account = await createAccount({
      email: 'mutations@example.com',
      password: 'Password123!',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
    });

    const user = await createUser({
      workspaceId: workspace.id,
      account,
      role: 'owner',
    });

    const { token } = await createDevice({ accountId: account.id });

    const nodeId = generateId(IdType.Space);
    const mutation = buildCreateNodeMutation({
      nodeId,
      attributes: {
        type: 'space',
        name: 'Idempotent Space',
        visibility: 'private',
        collaborators: {
          [user.id]: 'admin',
        },
      },
    });

    const secondMutation = {
      ...mutation,
      id: generateId(IdType.Mutation),
    };

    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/mutations`,
      headers: buildAuthHeader(token),
      payload: {
        mutations: [mutation, secondMutation],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { results: { status: number }[] };

    expect(body.results[0]?.status).toBe(MutationStatus.CREATED);
    expect(body.results[1]?.status).toBe(MutationStatus.OK);
  });
});

describe('delete cascade', () => {
  it('creates a tombstone and schedules cleanup on node.delete', async () => {
    const account = await createAccount({
      email: 'delete@example.com',
    });

    const workspace = await createWorkspace({
      createdBy: account.id,
    });

    const user = await createUser({
      workspaceId: workspace.id,
      account,
      role: 'owner',
    });

    const { token } = await createDevice({ accountId: account.id });

    const rootId = await createSpaceNode({
      workspaceId: workspace.id,
      userId: user.id,
    });

    const pageId = await createPageNode({
      workspaceId: workspace.id,
      userId: user.id,
      parentId: rootId,
      rootId,
    });

    const addJobSpy = vi
      .spyOn(jobService, 'addJob')
      .mockResolvedValue(undefined);

    const deletedAt = new Date().toISOString();
    const response = await app.inject({
      method: 'POST',
      url: `/client/v1/workspaces/${workspace.id}/mutations`,
      headers: buildAuthHeader(token),
      payload: {
        mutations: [
          {
            id: generateId(IdType.Mutation),
            createdAt: deletedAt,
            type: 'node.delete',
            data: {
              nodeId: pageId,
              rootId,
              deletedAt,
            },
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { results: { status: number }[] };
    expect(body.results[0]?.status).toBe(MutationStatus.OK);

    const deletedNode = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', pageId)
      .executeTakeFirst();

    expect(deletedNode).toBeUndefined();

    const tombstone = await database
      .selectFrom('node_tombstones')
      .selectAll()
      .where('id', '=', pageId)
      .executeTakeFirst();

    expect(tombstone).not.toBeNull();
    expect(tombstone?.root_id).toBe(rootId);

    expect(addJobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'node.clean',
        nodeId: pageId,
        parentId: rootId,
        workspaceId: workspace.id,
        userId: user.id,
      })
    );

    addJobSpy.mockRestore();
  });
});
