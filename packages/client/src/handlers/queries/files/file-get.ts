import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapFile } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { FileGetQueryInput } from '@colanode/client/queries/files/file-get';
import { Event } from '@colanode/client/types/events';
import { File } from '@colanode/client/types/files';

export class FileGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileGetQueryInput>
{
  public async handleQuery(input: FileGetQueryInput): Promise<File | null> {
    return await this.fetchFile(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileGetQueryInput,
    _: File | null
  ): Promise<ChangeCheckResult<FileGetQueryInput>> {
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
      event.type === 'file.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.id
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'file.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.id === input.id
    ) {
      return {
        hasChanges: true,
        result: null,
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

  private async fetchFile(input: FileGetQueryInput): Promise<File | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const file = await workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!file) {
      return null;
    }

    return mapFile(file);
  }
}
