import { UserSearchQueryInput } from '@/shared/queries/user-search';
import { databaseService } from '@/main/data/database-service';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { NodeTypes, UserNode } from '@colanode/core';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { Event } from '@/shared/types/events';

export class UserSearchQueryHandler
  implements QueryHandler<UserSearchQueryInput>
{
  public async handleQuery(input: UserSearchQueryInput): Promise<UserNode[]> {
    const rows =
      input.searchQuery.length > 0
        ? await this.searchUsers(input)
        : await this.fetchUsers(input);

    return this.buildUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: UserSearchQueryInput,
    _: UserNode[]
  ): Promise<ChangeCheckResult<UserSearchQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.type === 'user'
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.type === 'user'
    ) {
      const newResult = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'user'
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
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.User}
        AND n.id != ${input.userId}
        AND nn.name MATCH ${input.searchQuery + '*'}
        ${
          exclude.length > 0
            ? sql`AND n.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private async fetchUsers(input: UserSearchQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const exclude = input.exclude ?? [];
    return workspaceDatabase
      .selectFrom('nodes')
      .where('type', '=', 'user')
      .where('id', '!=', input.userId)
      .where('id', 'not in', exclude)
      .selectAll()
      .execute();
  }

  private buildUserNodes = (rows: SelectNode[]): UserNode[] => {
    return rows.map((row) => mapNode(row) as UserNode);
  };
}
