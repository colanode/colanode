import { eventBus } from '@colanode/client/lib/event-bus';
import { mapUser } from '@colanode/client/lib/mappers';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { createDebugger, SyncUserData, UserOutput } from '@colanode/core';

const debug = createDebugger('desktop:service:user');

export class UserService {
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async upsert(user: UserOutput) {
    debug(
      `Upserting user ${user.id} in workspace ${this.workspace.workspaceId}`
    );

    const existingUser = await this.workspace.database
      .selectFrom('users')
      .selectAll()
      .where('id', '=', user.id)
      .executeTakeFirst();

    const upsertedUser = await this.workspace.database
      .insertInto('users')
      .returningAll()
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        revision: user.revision,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        status: user.status,
        custom_name: user.customName,
        custom_avatar: user.customAvatar,
      })
      .onConflict((oc) =>
        oc
          .columns(['id'])
          .doUpdateSet({
            name: user.name,
            avatar: user.avatar,
            custom_name: user.customName,
            custom_avatar: user.customAvatar,
            role: user.role,
            status: user.status,
            revision: user.revision,
            updated_at: user.updatedAt,
          })
          .where('revision', '<', user.revision)
      )
      .executeTakeFirst();

    if (upsertedUser) {
      const eventType = existingUser ? 'user.updated' : 'user.created';
      eventBus.publish({
        type: eventType,
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        user: mapUser(upsertedUser),
      });
    }
  }

  public async syncServerUser(user: SyncUserData) {
    debug(
      `Syncing server user ${user.id} in workspace ${this.workspace.workspaceId}`
    );

    const existingUser = await this.workspace.database
      .selectFrom('users')
      .selectAll()
      .where('id', '=', user.id)
      .executeTakeFirst();

    const syncedUser = await this.workspace.database
      .insertInto('users')
      .returningAll()
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        revision: user.revision,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        status: user.status,
        custom_name: user.customName,
        custom_avatar: user.customAvatar,
      })
      .onConflict((oc) =>
        oc
          .columns(['id'])
          .doUpdateSet({
            name: user.name,
            avatar: user.avatar,
            custom_name: user.customName,
            custom_avatar: user.customAvatar,
            role: user.role,
            status: user.status,
            revision: user.revision,
            updated_at: user.updatedAt,
          })
          .where('revision', '<', user.revision)
      )
      .executeTakeFirst();

    if (syncedUser) {
      const eventType = existingUser ? 'user.updated' : 'user.created';
      eventBus.publish({
        type: eventType,
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        user: mapUser(syncedUser),
      });
    }
  }
}
