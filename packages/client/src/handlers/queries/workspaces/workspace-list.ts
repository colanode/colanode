import { SelectWorkspace } from '@colanode/client/databases/app';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { WorkspaceListQueryInput } from '@colanode/client/queries/workspaces/workspace-list';
import { AppService } from '@colanode/client/services/app-service';
import { Event } from '@colanode/client/types/events';
import { Workspace } from '@colanode/client/types/workspaces';

export class WorkspaceListQueryHandler
  implements QueryHandler<WorkspaceListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(): Promise<Workspace[]> {
    const rows = await this.fetchWorkspaces();
    return rows.map(mapWorkspace);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceListQueryInput,
    output: Workspace[]
  ): Promise<ChangeCheckResult<WorkspaceListQueryInput>> {
    if (event.type === 'workspace.created') {
      const newWorkspaces = [...output, event.workspace];
      return {
        hasChanges: true,
        result: newWorkspaces,
      };
    }

    if (event.type === 'workspace.updated') {
      const updatedWorkspaces = output.map((workspace) => {
        if (workspace.workspaceId === event.workspace.workspaceId) {
          return event.workspace;
        }
        return workspace;
      });

      return {
        hasChanges: true,
        result: updatedWorkspaces,
      };
    }

    if (event.type === 'workspace.deleted') {
      const activeWorkspaces = output.filter(
        (workspace) => workspace.workspaceId !== event.workspace.workspaceId
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

  private async fetchWorkspaces(): Promise<SelectWorkspace[]> {
    const workspaces = await this.app.database
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    return workspaces;
  }
}
