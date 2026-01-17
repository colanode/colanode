import { describe, expect, it } from 'vitest';

import { database } from '@colanode/server/data/database';
import { CollaborationSynchronizer } from '@colanode/server/synchronizers/collaborations';
import { generateId, IdType } from '@colanode/core';

const createCollaborationRow = async (input: {
  workspaceId: string;
  collaboratorId: string;
  nodeId: string;
  role: string;
}) => {
  return database
    .insertInto('collaborations')
    .returningAll()
    .values({
      node_id: input.nodeId,
      collaborator_id: input.collaboratorId,
      workspace_id: input.workspaceId,
      role: input.role,
      created_at: new Date(),
      created_by: input.collaboratorId,
      updated_at: null,
      updated_by: null,
      deleted_at: null,
      deleted_by: null,
    })
    .executeTakeFirstOrThrow();
};

describe('CollaborationSynchronizer', () => {
  it('returns collaborations in revision order after the cursor', async () => {
    const workspaceId = generateId(IdType.Workspace);
    const collaboratorId = generateId(IdType.User);

    const first = await createCollaborationRow({
      workspaceId,
      collaboratorId,
      nodeId: generateId(IdType.Space),
      role: 'admin',
    });

    const second = await createCollaborationRow({
      workspaceId,
      collaboratorId,
      nodeId: generateId(IdType.Page),
      role: 'editor',
    });

    const synchronizer = new CollaborationSynchronizer(
      'sync-collabs',
      {
        userId: collaboratorId,
        workspaceId,
        accountId: generateId(IdType.Account),
        deviceId: generateId(IdType.Device),
      },
      { type: 'collaborations' },
      '0'
    );

    const output = await synchronizer.fetchData();
    expect(output).not.toBeNull();

    const items = output?.items ?? [];
    expect(items).toHaveLength(2);

    const firstCursor = BigInt(items[0]!.cursor);
    const secondCursor = BigInt(items[1]!.cursor);

    expect(firstCursor).toBe(BigInt(first.revision));
    expect(secondCursor).toBe(BigInt(second.revision));
    expect(firstCursor < secondCursor).toBe(true);
  });
});
