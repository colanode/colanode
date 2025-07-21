import {
  SynchronizerOutputMessage,
  SyncUserData,
  SyncUsersInput,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectUser } from '@colanode/server/data/schema';
import { createLogger } from '@colanode/server/lib/logger';
import { BaseSynchronizer } from '@colanode/server/synchronizers/base';
import { Event } from '@colanode/server/types/events';

const logger = createLogger('user-synchronizer');

export class UserSynchronizer extends BaseSynchronizer<SyncUsersInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncUsersInput> | null> {
    const users = await this.fetchUsers();
    if (users.length === 0) {
      return null;
    }

    return this.buildMessage(users);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncUsersInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const users = await this.fetchUsers();
    if (users.length === 0) {
      return null;
    }

    return this.buildMessage(users);
  }

  private async fetchUsers() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';

    try {
      const users = await database
        .selectFrom('users')
        .selectAll()
        .where('workspace_id', '=', this.user.workspaceId)
        .where('revision', '>', this.cursor)
        .orderBy('revision', 'asc')
        .limit(50)
        .execute();

      return users;
    } catch (error) {
      logger.error(error, 'Error fetching users for sync');
    } finally {
      this.status = 'pending';
    }

    return [];
  }

  private buildMessage(
    unsyncedUsers: SelectUser[]
  ): SynchronizerOutputMessage<SyncUsersInput> {
    const items: SyncUserData[] = unsyncedUsers.map((user) => ({
      id: user.id,
      workspaceId: user.workspace_id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      customName: user.custom_name,
      customAvatar: user.custom_avatar,
      createdAt: user.created_at.toISOString(),
      updatedAt: user.updated_at?.toISOString() ?? null,
      revision: user.revision.toString(),
      status: user.status,
    }));

    return {
      type: 'synchronizer.output',
      userId: this.user.userId,
      id: this.id,
      items: items.map((item) => ({
        cursor: item.revision,
        data: item,
      })),
    };
  }

  private shouldFetch(event: Event) {
    if (
      event.type === 'user.created' &&
      event.workspaceId === this.user.workspaceId
    ) {
      return true;
    }

    if (
      event.type === 'user.updated' &&
      event.workspaceId === this.user.workspaceId
    ) {
      return true;
    }

    return false;
  }
}
