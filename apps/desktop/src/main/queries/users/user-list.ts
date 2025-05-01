import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { SelectUser } from '@/main/databases/workspace';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapUser } from '@/main/lib/mappers';
import { UserListQueryInput } from '@/shared/queries/users/user-list';
import { Event } from '@/shared/types/events';
import { User } from '@/shared/types/users';

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
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'user_created' &&
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
      event.type === 'user_updated' &&
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
      event.type === 'user_deleted' &&
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
