import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapWorkspace } from '@/main/utils';
import { WorkspaceGetQueryInput } from '@/shared/queries/workspaces/workspace-get';
import { Event } from '@/shared/types/events';
import { Workspace } from '@/shared/types/workspaces';

export class WorkspaceGetQueryHandler
  implements QueryHandler<WorkspaceGetQueryInput>
{
  public async handleQuery(
    input: WorkspaceGetQueryInput
  ): Promise<Workspace | null> {
    const row = await this.fetchWorkspace(input.accountId, input.workspaceId);
    if (!row) {
      return null;
    }

    return mapWorkspace(row);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceGetQueryInput,
    _: Workspace | null
  ): Promise<ChangeCheckResult<WorkspaceGetQueryInput>> {
    if (
      event.type === 'workspace_created' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: event.workspace,
      };
    }

    if (
      event.type === 'workspace_updated' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: event.workspace,
      };
    }

    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private fetchWorkspace(
    accountId: string,
    workspaceId: string
  ): Promise<SelectWorkspace | undefined> {
    return databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', accountId)
      .where('workspace_id', '=', workspaceId)
      .executeTakeFirst();
  }
}
