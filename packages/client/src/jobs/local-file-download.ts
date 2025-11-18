import ms from 'ms';

import { SelectLocalFile, UpdateLocalFile } from '@colanode/client/databases';
import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { eventBus, mapLocalFile, mapNode } from '@colanode/client/lib';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';

export type LocalFileDownloadInput = {
  type: 'local.file.download';
  userId: string;
  fileId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'local.file.download': {
      input: LocalFileDownloadInput;
    };
  }
}

const DOWNLOAD_RETRIES_LIMIT = 10;

export class LocalFileDownloadJobHandler
  implements JobHandler<LocalFileDownloadInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<LocalFileDownloadInput> = {
    limit: 1,
    key: (input: LocalFileDownloadInput) =>
      `local.file.download.${input.fileId}`,
  };

  public async handleJob(input: LocalFileDownloadInput): Promise<JobOutput> {
    const workspace = this.app.getWorkspace(input.userId);
    if (!workspace) {
      return {
        type: 'cancel',
      };
    }

    const account = this.app.getAccount(workspace.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    const localFile = await workspace.database
      .selectFrom('local_files')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!localFile) {
      return {
        type: 'cancel',
      };
    }

    const file = await this.fetchNode(workspace, input.fileId);
    if (!file) {
      await workspace.database
        .deleteFrom('local_files')
        .where('id', '=', input.fileId)
        .execute();

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

    return this.performDownload(workspace, localFile, file);
  }

  private async performDownload(
    workspace: WorkspaceService,
    localFile: SelectLocalFile,
    file: LocalFileNode
  ): Promise<JobOutput> {
    try {
      await this.updateLocalFile(workspace, localFile.id, {
        download_status: DownloadStatus.Downloading,
        download_progress: 0,
        download_completed_at: null,
        download_error_code: null,
        download_error_message: null,
      });

      const response = await workspace.account.client.get(
        `v1/workspaces/${workspace.workspaceId}/files/${file.id}`,
        {
          onDownloadProgress: async (progress, _chunk) => {
            const percentage = Math.round((progress.percent || 0) * 100);
            await this.updateLocalFile(workspace, localFile.id, {
              download_progress: percentage,
            });
          },
        }
      );

      const writeStream = await this.app.fs.writeStream(localFile.path);
      await response.body?.pipeTo(writeStream);

      await this.updateLocalFile(workspace, localFile.id, {
        download_status: DownloadStatus.Completed,
        download_completed_at: new Date().toISOString(),
        download_progress: 100,
        download_error_code: null,
        download_error_message: null,
      });

      return {
        type: 'success',
      };
    } catch {
      const newRetries = localFile.download_retries + 1;

      if (newRetries >= DOWNLOAD_RETRIES_LIMIT) {
        await this.updateLocalFile(workspace, localFile.id, {
          download_status: DownloadStatus.Failed,
          download_completed_at: new Date().toISOString(),
          download_progress: 0,
          download_error_code: 'file_download_failed',
          download_error_message:
            'Failed to download file after ' + newRetries + ' retries',
        });

        return {
          type: 'cancel',
        };
      }

      await this.updateLocalFile(workspace, localFile.id, {
        download_status: DownloadStatus.Pending,
        download_retries: newRetries,
        download_completed_at: null,
      });

      return { type: 'retry', delay: ms('1 minute') };
    }
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

  private async updateLocalFile(
    workspace: WorkspaceService,
    fileId: string,
    values: UpdateLocalFile
  ): Promise<void> {
    const updatedLocalFile = await workspace.database
      .updateTable('local_files')
      .returningAll()
      .set(values)
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!updatedLocalFile) {
      return;
    }

    const exists = await this.app.fs.exists(updatedLocalFile.path);
    const url = exists ? await this.app.fs.url(updatedLocalFile.path) : null;
    eventBus.publish({
      type: 'local.file.updated',
      workspace: {
        workspaceId: workspace.workspaceId,
        userId: workspace.userId,
        accountId: workspace.accountId,
      },
      localFile: mapLocalFile(updatedLocalFile, url),
    });
  }
}
