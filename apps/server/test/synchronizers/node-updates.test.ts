import { describe, expect, it } from 'vitest';

import { database } from '@colanode/server/data/database';
import { NodeUpdatesSynchronizer } from '@colanode/server/synchronizers/node-updates';
import { generateId, IdType } from '@colanode/core';
import { YDoc } from '@colanode/crdt';

const createNodeUpdate = async (input: {
  nodeId: string;
  rootId: string;
  workspaceId: string;
  createdBy: string;
}) => {
  const ydoc = new YDoc();
  const data = ydoc.getState();

  return database
    .insertInto('node_updates')
    .returningAll()
    .values({
      id: generateId(IdType.Update),
      node_id: input.nodeId,
      root_id: input.rootId,
      workspace_id: input.workspaceId,
      data,
      created_at: new Date(),
      created_by: input.createdBy,
      merged_updates: null,
    })
    .executeTakeFirstOrThrow();
};

describe('NodeUpdatesSynchronizer', () => {
  it('returns updates in revision order after the cursor', async () => {
    const rootId = generateId(IdType.Space);
    const nodeId = generateId(IdType.Page);
    const workspaceId = generateId(IdType.Workspace);
    const userId = generateId(IdType.User);

    const first = await createNodeUpdate({
      nodeId,
      rootId,
      workspaceId,
      createdBy: userId,
    });

    const second = await createNodeUpdate({
      nodeId,
      rootId,
      workspaceId,
      createdBy: userId,
    });

    const synchronizer = new NodeUpdatesSynchronizer(
      'sync-1',
      {
        userId,
        workspaceId,
        accountId: generateId(IdType.Account),
        deviceId: generateId(IdType.Device),
      },
      { type: 'node.updates', rootId },
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

    const afterCursorSync = new NodeUpdatesSynchronizer(
      'sync-2',
      {
        userId,
        workspaceId,
        accountId: generateId(IdType.Account),
        deviceId: generateId(IdType.Device),
      },
      { type: 'node.updates', rootId },
      first.revision.toString()
    );

    const afterOutput = await afterCursorSync.fetchData();
    expect(afterOutput?.items).toHaveLength(1);
    expect(afterOutput?.items[0]?.cursor).toBe(second.revision.toString());
  });
});
