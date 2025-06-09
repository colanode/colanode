import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapFileState } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { FileStateGetQueryInput } from '@colanode/client/queries/files/file-state-get';
import { Event } from '@colanode/client/types/events';
import { FileState } from '@colanode/client/types/files';

export class FileStateGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileStateGetQueryInput>
{
  public async handleQuery(
    input: FileStateGetQueryInput
  ): Promise<FileState | null> {
    return await this.fetchFileState(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileStateGetQueryInput,
    _: FileState | null
  ): Promise<ChangeCheckResult<FileStateGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'file.state.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.fileState.id === input.id
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.id
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.id
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFileState(
    input: FileStateGetQueryInput
  ): Promise<FileState | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const fileState = await workspace.database
      .selectFrom('file_states')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!fileState) {
      return null;
    }

    return mapFileState(fileState);
  }
}
