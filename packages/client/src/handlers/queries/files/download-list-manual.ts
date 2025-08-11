import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDownload } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DownloadListManualQueryInput } from '@colanode/client/queries/files/download-list-manual';
import { Event } from '@colanode/client/types/events';
import { Download, DownloadType } from '@colanode/client/types/files';

export class DownloadListManualQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DownloadListManualQueryInput>
{
  public async handleQuery(
    input: DownloadListManualQueryInput
  ): Promise<Download[]> {
    return await this.fetchManualDownloads(input);
  }

  public async checkForChanges(
    event: Event,
    input: DownloadListManualQueryInput,
    output: Download[]
  ): Promise<ChangeCheckResult<DownloadListManualQueryInput>> {
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
      event.workspaceId === input.workspaceId &&
      event.download.type === DownloadType.Manual
    ) {
      const newResult = await this.fetchManualDownloads(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'download.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.download.type === DownloadType.Manual
    ) {
      const download = output.find(
        (download) => download.id === event.download.id
      );

      if (download) {
        const newResult = output.map((download) => {
          if (download.id === event.download.id) {
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
      event.workspaceId === input.workspaceId &&
      event.download.type === DownloadType.Manual
    ) {
      const download = output.find(
        (download) => download.id === event.download.id
      );

      if (!download) {
        return {
          hasChanges: false,
        };
      }

      if (output.length === input.count) {
        const newResult = await this.fetchManualDownloads(input);
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

  private async fetchManualDownloads(
    input: DownloadListManualQueryInput
  ): Promise<Download[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const downloads = await workspace.database
      .selectFrom('downloads')
      .selectAll()
      .where('type', '=', DownloadType.Manual)
      .orderBy('id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return downloads.map(mapDownload);
  }
}
