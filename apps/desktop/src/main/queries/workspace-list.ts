import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapWorkspace } from '@/main/utils';
import { WorkspaceListQueryInput } from '@/shared/queries/workspace-list';
import { Event } from '@/shared/types/events';
import { Workspace } from '@/shared/types/workspaces';

export class WorkspaceListQueryHandler
  implements QueryHandler<WorkspaceListQueryInput>
{
  public async handleQuery(
    input: WorkspaceListQueryInput
  ): Promise<Workspace[]> {
    const rows = await this.fetchWorkspaces(input.accountId);
    return rows.map(mapWorkspace);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceListQueryInput,
    output: Workspace[]
  ): Promise<ChangeCheckResult<WorkspaceListQueryInput>> {
    if (
      event.type === 'workspace_created' &&
      event.workspace.accountId === input.accountId
    ) {
      const newWorkspaces = [...output, event.workspace];
      return {
        hasChanges: true,
        result: newWorkspaces,
      };
    }

    if (
      event.type === 'workspace_updated' &&
      event.workspace.accountId === input.accountId
    ) {
      const updatedWorkspaces = output.map((workspace) => {
        if (workspace.id === event.workspace.id) {
          return event.workspace;
        }
        return workspace;
      });

      return {
        hasChanges: true,
        result: updatedWorkspaces,
      };
    }

    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId
    ) {
      const activeWorkspaces = output.filter(
        (workspace) => workspace.id !== event.workspace.id
      );

      return {
        hasChanges: true,
        result: activeWorkspaces,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchWorkspaces(accountId: string): Promise<SelectWorkspace[]> {
    return databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', accountId)
      .execute();
  }
}
