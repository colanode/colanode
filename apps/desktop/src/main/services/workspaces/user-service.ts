import { createDebugger, SyncUserData } from '@colanode/core';

import { mapUser } from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';

const debug = createDebugger('desktop:service:user');

export class UserService {
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async syncServerUser(user: SyncUserData) {
    debug(`Syncing server user ${user.id} in workspace ${this.workspace.id}`);

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
        type: 'user_created',
        accountId: this.workspace.account.id,
        workspaceId: this.workspace.id,
        user: mapUser(createdUser),
      });
    }
  }
}
