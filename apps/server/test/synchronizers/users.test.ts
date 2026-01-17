import { describe, expect, it } from 'vitest';

import { database } from '@colanode/server/data/database';
import { UserSynchronizer } from '@colanode/server/synchronizers/users';
import { generateId, IdType, UserStatus } from '@colanode/core';

const createUserRow = async (input: {
  workspaceId: string;
  accountId: string;
  role: string;
  email: string;
  name: string;
  status: UserStatus;
}) => {
  return database
    .insertInto('users')
    .returningAll()
    .values({
      id: generateId(IdType.User),
      workspace_id: input.workspaceId,
      account_id: input.accountId,
      role: input.role,
      name: input.name,
      email: input.email,
      avatar: null,
      custom_name: null,
      custom_avatar: null,
      created_at: new Date(),
      created_by: input.accountId,
      status: input.status,
      max_file_size: '0',
      storage_limit: '0',
    })
    .executeTakeFirstOrThrow();
};

describe('UserSynchronizer', () => {
  it('returns users in revision order after the cursor', async () => {
    const workspaceId = generateId(IdType.Workspace);
    const accountId = generateId(IdType.Account);
    const userId = generateId(IdType.User);

    const first = await createUserRow({
      workspaceId,
      accountId,
      role: 'owner',
      email: 'first@example.com',
      name: 'First',
      status: UserStatus.Active,
    });

    const second = await createUserRow({
      workspaceId,
      accountId: generateId(IdType.Account),
      role: 'collaborator',
      email: 'second@example.com',
      name: 'Second',
      status: UserStatus.Active,
    });

    const synchronizer = new UserSynchronizer(
      'sync-users',
      {
        userId,
        workspaceId,
        accountId,
        deviceId: generateId(IdType.Device),
      },
      { type: 'users' },
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
