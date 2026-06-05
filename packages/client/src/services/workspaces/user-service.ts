import { eventBus } from '@colanode/client/lib/event-bus';
import { mapUser } from '@colanode/client/lib/mappers';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
  createDebugger,
  SyncUserData,
  UserOutput,
  UserStatus,
} from '@colanode/core';

const debug = createDebugger('desktop:service:user');

export class UserService {
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async ensureLocalUser() {
    const existing = await this.workspace.database
      .selectFrom('users')
      .select('id')
      .where('id', '=', this.workspace.userId)
      .executeTakeFirst();

    if (existing) {
      return;
    }

    const account = this.workspace.account.account;
    const now = new Date().toISOString();

    debug(
      `Seeding local user ${this.workspace.userId} in workspace ${this.workspace.workspaceId}`
    );

    const createdUser = await this.workspace.database
      .insertInto('users')
      .returningAll()
      .values({
        id: this.workspace.userId,
        email: account.email,
        name: account.name,
        avatar: account.avatar ?? null,
        custom_name: null,
        custom_avatar: null,
        role: this.workspace.role,
        status: UserStatus.Active,
        revision: '1',
        created_at: now,
        updated_at: null,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();

    if (createdUser) {
      eventBus.publish({
        type: 'user.created',
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        user: mapUser(createdUser),
      });
    }
  }

  public async upsert(user: UserOutput) {
    debug(
      `Upserting user ${user.id} in workspace ${this.workspace.workspaceId}`
    );

    const createdUser = await this.workspace.database
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

    if (createdUser) {
      eventBus.publish({
        type: 'user.created',
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        user: mapUser(createdUser),
      });
    }
  }

  public async syncServerUser(user: SyncUserData) {
    if (this.workspace.account.app.meta.localOnly) {
      return;
    }

    debug(
      `Syncing server user ${user.id} in workspace ${this.workspace.workspaceId}`
    );

    const createdUser = await this.workspace.database
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

    if (createdUser) {
      eventBus.publish({
        type: 'user.created',
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        user: mapUser(createdUser),
      });
    }
  }
}
