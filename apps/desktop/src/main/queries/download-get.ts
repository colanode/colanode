import { DownloadGetQueryInput } from '@/shared/queries/download-get';
import { databaseService } from '@/main/data/database-service';
import { Download } from '@/shared/types/nodes';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapDownload } from '@/main/utils';
import { Event } from '@/shared/types/events';
import { SelectDownload } from '@/main/data/workspace/schema';

export class DownloadGetQueryHandler
  implements QueryHandler<DownloadGetQueryInput>
{
  public async handleQuery(
    input: DownloadGetQueryInput
  ): Promise<Download | null> {
    const row = await this.fetchDownload(input);
    return row ? mapDownload(row) : null;
  }

  public async checkForChanges(
    event: Event,
    input: DownloadGetQueryInput,
    _: Download | null
  ): Promise<ChangeCheckResult<DownloadGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'download_created' &&
      event.userId === input.userId &&
      event.download.nodeId === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.download,
      };
    }

    if (
      event.type === 'download_updated' &&
      event.userId === input.userId &&
      event.download.nodeId === input.nodeId
    ) {
      return {
        hasChanges: true,
        result: event.download,
      };
    }

    if (
      event.type === 'download_deleted' &&
      event.userId === input.userId &&
      event.download.nodeId === input.nodeId
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

  private async fetchDownload(
    input: DownloadGetQueryInput
  ): Promise<SelectDownload | undefined> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('node_id', '=', input.nodeId)
      .executeTakeFirst();

    return row;
  }
}
