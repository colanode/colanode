import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { LocalFileGetQueryInput } from '@colanode/client/queries';
import { LocalFile } from '@colanode/client/types';
import { Event } from '@colanode/client/types/events';

export class LocalFileGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<LocalFileGetQueryInput>
{
  public async handleQuery(
    input: LocalFileGetQueryInput
  ): Promise<LocalFile | null> {
    return await this.fetchLocalFile(input);
  }

  public async checkForChanges(
    event: Event,
    input: LocalFileGetQueryInput,
    _: LocalFile | null
  ): Promise<ChangeCheckResult<LocalFileGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'local.file.created' &&
      event.workspace.userId === input.userId &&
      event.localFile.id === input.fileId
    ) {
      return {
        hasChanges: true,
        result: event.localFile,
      };
    }

    if (
      event.type === 'local.file.updated' &&
      event.workspace.userId === input.userId &&
      event.localFile.id === input.fileId
    ) {
      return {
        hasChanges: true,
        result: event.localFile,
      };
    }

    if (
      event.type === 'local.file.deleted' &&
      event.workspace.userId === input.userId &&
      event.localFile.id === input.fileId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.fileId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.created' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.fileId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.fileId
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

  private async fetchLocalFile(
    input: LocalFileGetQueryInput
  ): Promise<LocalFile | null> {
    const workspace = this.getWorkspace(input.userId);
    return workspace.files.getLocalFile(
      input.fileId,
      input.autoDownload ?? false
    );
  }
}
