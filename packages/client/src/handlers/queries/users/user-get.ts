import { SelectUser } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapUser } from '@colanode/client/lib/mappers';
import { UserGetQueryInput } from '@colanode/client/queries/users/user-get';
import { Event } from '@colanode/client/types/events';
import { User } from '@colanode/client/types/users';

export class UserGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UserGetQueryInput>
{
  public async handleQuery(input: UserGetQueryInput): Promise<User | null> {
    const row = await this.fetchUser(input);
    return row ? mapUser(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: UserGetQueryInput,
    _: User | null
  ): Promise<ChangeCheckResult<UserGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'user.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.user.id === input.userId
    ) {
      return {
        hasChanges: true,
        result: event.user,
      };
    }

    if (
      event.type === 'user.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.user.id === input.userId
    ) {
      return {
        hasChanges: true,
        result: event.user,
      };
    }

    if (
      event.type === 'user.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.user.id === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchUser(
    input: UserGetQueryInput
  ): Promise<SelectUser | undefined> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const row = await workspace.database
      .selectFrom('users')
      .selectAll()
      .where('id', '=', input.userId)
      .executeTakeFirst();

    return row;
  }
}
