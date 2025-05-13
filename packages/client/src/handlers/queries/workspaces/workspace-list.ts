import { SelectWorkspace } from '../../../databases/account';
import { AppService } from '../../../services/app-service';
import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapWorkspace } from '../../../lib/mappers';
import { WorkspaceListQueryInput } from '../../../queries/workspaces/workspace-list';
import { Event } from '../../../types/events';
import { Workspace } from '../../../types/workspaces';

export class WorkspaceListQueryHandler
  implements QueryHandler<WorkspaceListQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

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

  private async fetchWorkspaces(accountId: string): Promise<SelectWorkspace[]> {
    const account = this.app.getAccount(accountId);
    if (!account) {
      return [];
    }

    const workspaces = await account.database
      .selectFrom('workspaces')
      .selectAll()
      .execute();

    return workspaces;
  }
}
