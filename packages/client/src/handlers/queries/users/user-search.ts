import { SelectUser } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapUser } from '@colanode/client/lib/mappers';
import { UserSearchQueryInput } from '@colanode/client/queries/users/user-search';
import { Event } from '@colanode/client/types/events';
import { User } from '@colanode/client/types/users';

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
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
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

  private async searchUsers(
    input: UserSearchQueryInput
  ): Promise<SelectUser[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const exclude = input.exclude ?? [];

    let queryBuilder = workspace.database
      .selectFrom('users')
      .selectAll()
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
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectUser[]): User[] => {
    return rows.map((row) => mapUser(row));
  };
}
