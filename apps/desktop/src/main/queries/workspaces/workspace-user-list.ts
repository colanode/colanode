import { NodeTypes, UserNode } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { WorkspaceUserListQueryInput } from '@/shared/queries/workspaces/workspace-user-list';
import { Event } from '@/shared/types/events';

export class WorkspaceUserListQueryHandler
  implements QueryHandler<WorkspaceUserListQueryInput>
{
  public async handleQuery(
    input: WorkspaceUserListQueryInput
  ): Promise<UserNode[]> {
    const rows = await this.fetchNodes(input);
    return this.buildWorkspaceUserNodes(rows);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceUserListQueryInput,
    output: UserNode[]
  ): Promise<ChangeCheckResult<WorkspaceUserListQueryInput>> {
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
      const user = output.find((user) => user.id === event.node.id);
      if (user) {
        const newUsers = output.map((user) => {
          if (user.id === event.node.id) {
            return event.node as UserNode;
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

  private async fetchNodes(
    input: WorkspaceUserListQueryInput
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const rows = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', 'user')
      .orderBy('created_at asc')
      .offset(offset)
      .limit(input.count)
      .execute();

    return rows;
  }

  private buildWorkspaceUserNodes = (rows: SelectNode[]): UserNode[] => {
    const nodes = rows.map(mapNode);
    const users: UserNode[] = [];

    for (const node of nodes) {
      if (node.type === NodeTypes.User) {
        users.push(node as UserNode);
      }
    }

    return users;
  };
}
