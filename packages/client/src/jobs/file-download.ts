import ms from 'ms';

import { SelectDownload, UpdateDownload } from '@colanode/client/databases';
import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import {
  eventBus,
  mapDownload,
  mapLocalFile,
  mapNode,
} from '@colanode/client/lib';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';

export type FileDownloadInput = {
  type: 'file.download';
  accountId: string;
  workspaceId: string;
  downloadId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'file.download': {
      input: FileDownloadInput;
    };
  }
}

const DOWNLOAD_RETRIES_LIMIT = 10;

export class FileDownloadJobHandler implements JobHandler<FileDownloadInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<FileDownloadInput> = {
    limit: 1,
    key: (input: FileDownloadInput) => `file.download.${input.downloadId}`,
  };

  public async handleJob(input: FileDownloadInput): Promise<JobOutput> {
    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    const workspace = account.getWorkspace(input.workspaceId);
    if (!workspace) {
      return {
        type: 'cancel',
      };
    }

    const download = await this.fetchDownload(workspace, input.downloadId);
    if (!download) {
      return {
        type: 'cancel',
      };
    }

    const file = await this.fetchNode(workspace, download.file_id);
    if (!file) {
      await this.updateDownload(workspace, download.id, {
        status: DownloadStatus.Failed,
        error_code: 'file_deleted',
        error_message: 'File has been deleted',
      });

      return {
        type: 'cancel',
      };
    }

    if (file.attributes.status === FileStatus.Pending) {
      return {
        type: 'retry',
        delay: ms('5 seconds'),
      };
    }

    if (!account.server.isAvailable) {
      return {
        type: 'retry',
        delay: ms('5 seconds'),
      };
    }

    return this.performDownload(workspace, download, file);
  }

  private async performDownload(
    workspace: WorkspaceService,
    download: SelectDownload,
    file: LocalFileNode
  ): Promise<JobOutput> {
    try {
      await this.updateDownload(workspace, download.id, {
        status: DownloadStatus.Downloading,
        started_at: new Date().toISOString(),
      });

      const response = await workspace.account.client.get(
        `v1/workspaces/${workspace.id}/files/${file.id}`,
        {
          onDownloadProgress: async (progress, _chunk) => {
            const percentage = Math.round((progress.percent || 0) * 100);
            await this.updateDownload(workspace, download.id, {
              progress: percentage,
            });
          },
        }
      );

      const writeStream = await this.app.fs.writeStream(download.path);
      await response.body?.pipeTo(writeStream);

      const createdLocalFile = await workspace.database
        .insertInto('local_files')
        .returningAll()
        .values({
          id: file.id,
          version: file.attributes.version,
          name: file.attributes.name,
          extension: file.attributes.extension,
          subtype: file.attributes.subtype,
          mime_type: file.attributes.mimeType,
          size: file.attributes.size,
          created_at: new Date().toISOString(),
          path: download.path,
          opened_at: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.column('id').doUpdateSet({
            version: file.attributes.version,
            name: file.attributes.name,
            mime_type: file.attributes.mimeType,
            size: file.attributes.size,
            path: download.path,
          })
        )
        .executeTakeFirst();

      if (!createdLocalFile) {
        await this.updateDownload(workspace, download.id, {
          status: DownloadStatus.Pending,
          retries: download.retries + 1,
          error_code: 'file_download_failed',
          error_message: 'Failed to create local file',
        });

        return {
          type: 'retry',
          delay: ms('10 seconds'),
        };
      }

      const url = await this.app.fs.url(createdLocalFile.path);
      eventBus.publish({
        type: 'local.file.created',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        localFile: mapLocalFile(createdLocalFile, url),
      });

      await this.updateDownload(workspace, download.id, {
        status: DownloadStatus.Completed,
        completed_at: new Date().toISOString(),
        progress: 100,
        error_code: null,
        error_message: null,
      });

      return {
        type: 'success',
      };
    } catch {
      const newRetries = download.retries + 1;

      if (newRetries >= DOWNLOAD_RETRIES_LIMIT) {
        await this.updateDownload(workspace, download.id, {
          status: DownloadStatus.Failed,
          completed_at: new Date().toISOString(),
          progress: 0,
          error_code: 'file_download_failed',
          error_message:
            'Failed to download file after ' + newRetries + ' retries',
        });

        return {
          type: 'cancel',
        };
      }

      await this.updateDownload(workspace, download.id, {
        status: DownloadStatus.Pending,
        retries: newRetries,
        started_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
      });

      return {
        type: 'retry',
        delay: ms('1 minute'),
      };
    }
  }

  private async fetchDownload(
    workspace: WorkspaceService,
    downloadId: string
  ): Promise<SelectDownload | undefined> {
    return workspace.database
      .selectFrom('downloads')
      .selectAll()
      .where('id', '=', downloadId)
      .executeTakeFirst();
  }

  private async fetchNode(
    workspace: WorkspaceService,
    fileId: string
  ): Promise<LocalFileNode | undefined> {
    const node = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return undefined;
    }

    return mapNode(node) as LocalFileNode;
  }

  private async updateDownload(
    workspace: WorkspaceService,
    downloadId: string,
    values: UpdateDownload
  ): Promise<void> {
    const updatedDownload = await workspace.database
      .updateTable('downloads')
      .returningAll()
      .set(values)
      .where('id', '=', downloadId)
      .executeTakeFirst();

    if (!updatedDownload) {
      return;
    }

    eventBus.publish({
      type: 'download.updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      download: mapDownload(updatedDownload),
    });
  }
}
