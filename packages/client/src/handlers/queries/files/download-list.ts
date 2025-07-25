import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDownload } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DownloadListQueryInput } from '@colanode/client/queries/files/download-list';
import { Event } from '@colanode/client/types/events';
import { Download } from '@colanode/client/types/files';

export class DownloadListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DownloadListQueryInput>
{
  public async handleQuery(input: DownloadListQueryInput): Promise<Download[]> {
    return await this.fetchDownloads(input);
  }

  public async checkForChanges(
    event: Event,
    input: DownloadListQueryInput,
    output: Download[]
  ): Promise<ChangeCheckResult<DownloadListQueryInput>> {
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
      event.type === 'download.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const newResult = await this.fetchDownloads(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'download.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const download = output.find(
        (download) => download.fileId === event.download.fileId
      );

      if (download) {
        const newResult = output.map((download) => {
          if (download.fileId === event.download.fileId) {
            return event.download;
          }

          return download;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'download.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const download = output.find(
        (download) => download.fileId === event.download.fileId
      );

      if (!download) {
        return {
          hasChanges: false,
        };
      }

      if (output.length === input.count) {
        const newResult = await this.fetchDownloads(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }

      const newOutput = output.filter(
        (download) => download.fileId !== event.download.fileId
      );
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchDownloads(
    input: DownloadListQueryInput
  ): Promise<Download[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const query = workspace.database.selectFrom('downloads').selectAll();

    const downloads = await query
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return downloads.map(mapDownload);
  }
}
