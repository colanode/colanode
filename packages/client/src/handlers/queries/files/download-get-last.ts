import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDownload } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DownloadGetLastQueryInput } from '@colanode/client/queries/files/download-get-last';
import { Event } from '@colanode/client/types/events';
import { Download } from '@colanode/client/types/files';

export class DownloadGetLastQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DownloadGetLastQueryInput>
{
  public async handleQuery(
    input: DownloadGetLastQueryInput
  ): Promise<Download | null> {
    return await this.fetchLastDownload(input);
  }

  public async checkForChanges(
    event: Event,
    input: DownloadGetLastQueryInput,
    output: Download | null
  ): Promise<ChangeCheckResult<DownloadGetLastQueryInput>> {
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
      event.type === 'download.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.download.fileId === input.fileId &&
      (!input.downloadType || event.download.type === input.downloadType)
    ) {
      const newResult = await this.fetchLastDownload(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'download.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.download.fileId === input.fileId &&
      (!input.downloadType || event.download.type === input.downloadType) &&
      output?.id === event.download.id
    ) {
      return {
        hasChanges: true,
        result: event.download,
      };
    }

    if (
      event.type === 'download.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.download.fileId === input.fileId &&
      output?.id === event.download.id
    ) {
      const newResult = await this.fetchLastDownload(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchLastDownload(
    input: DownloadGetLastQueryInput
  ): Promise<Download | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    let query = workspace.database
      .selectFrom('downloads')
      .selectAll()
      .where('file_id', '=', input.fileId);

    if (input.downloadType !== undefined) {
      query = query.where('type', '=', input.downloadType);
    }

    const download = await query.orderBy('id', 'desc').executeTakeFirst();

    if (!download) {
      return null;
    }

    return mapDownload(download);
  }
}
