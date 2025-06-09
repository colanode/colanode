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
    return this.buildWorkspaceUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserListQueryInput,
    output: User[]
  ): Promise<ChangeCheckResult<UserListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'user.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'user.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const user = output.find((user) => user.id === event.user.id);
      if (user) {
        const newUsers = output.map((user) => {
          if (user.id === event.user.id) {
            return event.user;
          }
          return user;
        });

        return {
          hasChanges: true,
          result: newUsers,
        };
      }
    }

    if (
      event.type === 'user.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.handleQuery(input);
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
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const rows = await workspace.database
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'asc')
      .offset(offset)
      .limit(input.count)
      .execute();

    return rows;
  }

  private buildWorkspaceUserNodes = (rows: SelectUser[]): User[] => {
    const users = rows.map(mapUser);
    return users;
  };
}
