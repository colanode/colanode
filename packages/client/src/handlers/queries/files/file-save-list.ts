import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { FileSaveListQueryInput } from '@colanode/client/queries/files/file-save-list';
import { Event } from '@colanode/client/types/events';
import { FileSaveState } from '@colanode/client/types/files';

export class FileSaveListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileSaveListQueryInput>
{
  public async handleQuery(
    input: FileSaveListQueryInput
  ): Promise<FileSaveState[]> {
    return this.getSaves(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileSaveListQueryInput,
    _: FileSaveState[]
  ): Promise<ChangeCheckResult<FileSaveListQueryInput>> {
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
      event.type === 'file.save.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: this.getSaves(input),
      };
    }

    return {
      hasChanges: false,
    };
  }

  private getSaves(input: FileSaveListQueryInput): FileSaveState[] {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const saves = workspace.files.getSaves();
    return saves;
  }
}
