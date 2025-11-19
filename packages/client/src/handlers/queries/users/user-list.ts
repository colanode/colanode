import { SelectUser } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapUser } from '@colanode/client/lib/mappers';
import { UserListQueryInput } from '@colanode/client/queries/users/user-list';
import { Event } from '@colanode/client/types/events';
import { User } from '@colanode/client/types/users';

export class UserListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UserListQueryInput>
{
  public async handleQuery(input: UserListQueryInput): Promise<User[]> {
    const rows = await this.fetchUsers(input);
    return rows.map(mapUser);
  }

  public async checkForChanges(
    event: Event,
    input: UserListQueryInput,
    output: User[]
  ): Promise<ChangeCheckResult<UserListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'user.created' &&
      event.workspace.userId === input.userId
    ) {
      const newResult = [...output, event.user];
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'user.updated' &&
      event.workspace.userId === input.userId
    ) {
      const user = output.find((user) => user.id === event.user.id);
      if (user) {
        const newResult = output.map((user) => {
          if (user.id === event.user.id) {
            return event.user;
          }
          return user;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'user.deleted' &&
      event.workspace.userId === input.userId
    ) {
      const newResult = output.filter((user) => user.id !== event.user.id);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchUsers(input: UserListQueryInput): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.userId);

    const rows = await workspace.database
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();

    return rows;
  }
}
