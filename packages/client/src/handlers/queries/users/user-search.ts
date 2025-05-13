import { WorkspaceQueryHandlerBase } from '../workspace-query-handler-base';
import { SelectUser } from '../../../databases/workspace';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapUser } from '../../../lib/mappers';
import { UserSearchQueryInput } from '../../../queries/users/user-search';
import { Event } from '../../../types/events';
import { User } from '../../../types/users';

export class UserSearchQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(input: UserSearchQueryInput): Promise<User[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);

    return this.buildUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserSearchQueryInput,
    _: User[]
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
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
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
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

  private async searchUsers(
    input: UserSearchQueryInput
  ): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const exclude = input.exclude ?? [];

    let queryBuilder = workspace.database
      .selectFrom('users')
      .selectAll()
      .where('id', '!=', workspace.userId)
      .where('name', 'like', `%${input.searchQuery}%`);

    if (exclude.length > 0) {
      queryBuilder = queryBuilder.where('id', 'not in', exclude);
    }

    const rows = await queryBuilder.execute();
    return rows;
  }

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const exclude = input.exclude ?? [];
    return workspace.database
      .selectFrom('users')
      .where('id', '!=', workspace.userId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectUser[]): User[] => {
    return rows.map((row) => mapUser(row));
  };
}
