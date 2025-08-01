import ms from 'ms';
import { Upload } from 'tus-js-client';

import {
  SelectLocalFile,
  SelectUpload,
  UpdateUpload,
} from '@colanode/client/databases';
import {
  JobHandler,
  JobOutput,
  JobConcurrencyConfig,
} from '@colanode/client/jobs';
import { eventBus, mapNode, mapUpload } from '@colanode/client/lib';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { LocalFileNode, UploadStatus } from '@colanode/client/types';
import { ApiHeader, build, calculatePercentage } from '@colanode/core';

export type FileUploadInput = {
  type: 'file.upload';
  accountId: string;
  workspaceId: string;
  fileId: string;
};

declare module '@colanode/client/jobs' {
  interface JobMap {
    'file.upload': {
      input: FileUploadInput;
    };
  }
}

const UPLOAD_RETRIES_LIMIT = 10;

export class FileUploadJobHandler implements JobHandler<FileUploadInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public readonly concurrency: JobConcurrencyConfig<FileUploadInput> = {
    limit: 1,
    key: (input: FileUploadInput) => `file.upload.${input.fileId}`,
  };

  public async handleJob(input: FileUploadInput): Promise<JobOutput> {
    const account = this.app.getAccount(input.accountId);
    if (!account) {
      return {
        type: 'cancel',
      };
    }

    if (!account.server.isAvailable) {
      return {
        type: 'retry',
        delay: ms('2 seconds'),
      };
    }

    const workspace = account.getWorkspace(input.workspaceId);
    if (!workspace) {
      return {
        type: 'cancel',
      };
    }

    const upload = await this.fetchUpload(workspace, input.fileId);
    if (!upload) {
      return {
        type: 'cancel',
      };
    }

    const file = await this.fetchNode(workspace, upload.file_id);
    if (!file) {
      return {
        type: 'cancel',
      };
    }

    const localFile = await this.fetchLocalFile(workspace, file.id);
    if (!localFile) {
      return {
        type: 'cancel',
      };
    }

    if (file.serverRevision === '0') {
      return {
        type: 'retry',
        delay: ms('2 seconds'),
      };
    }

    return this.performUpload(account, workspace, upload, file, localFile);
  }

  private async performUpload(
    account: AccountService,
    workspace: WorkspaceService,
    upload: SelectUpload,
    file: LocalFileNode,
    localFile: SelectLocalFile
  ): Promise<JobOutput> {
    try {
      await this.updateUpload(workspace, upload.file_id, {
        status: UploadStatus.Uploading,
        started_at: new Date().toISOString(),
      });

      const updateUpload = async (values: UpdateUpload) => {
        await this.updateUpload(workspace, upload.file_id, {
          ...values,
        });
      };

      const fileStream = await this.app.fs.readStream(localFile.path);
      await new Promise<void>((resolve, reject) => {
        const tusUpload = new Upload(fileStream, {
          endpoint: `${account.server.httpBaseUrl}/v1/workspaces/${workspace.id}/files/${file.id}/tus`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: {
            filename: localFile.name,
            filetype: file.type,
          },
          headers: {
            Authorization: `Bearer ${account.token}`,
            [ApiHeader.ClientType]: this.app.meta.type,
            [ApiHeader.ClientPlatform]: this.app.meta.platform,
            [ApiHeader.ClientVersion]: build.version,
          },
          onError: function (error) {
            updateUpload({
              status: UploadStatus.Failed,
              completed_at: new Date().toISOString(),
              progress: 0,
              error_code: 'file_upload_failed',
              error_message: error.message,
            });
            reject(error);
          },
          onProgress: function (bytesUploaded, bytesTotal) {
            const percentage = calculatePercentage(bytesUploaded, bytesTotal);
            updateUpload({
              progress: percentage,
            });
          },
          onSuccess: function () {
            updateUpload({
              status: UploadStatus.Completed,
              progress: 100,
              completed_at: new Date().toISOString(),
              error_code: null,
              error_message: null,
            });
            resolve();
          },
        });

        tusUpload.findPreviousUploads().then((previousUploads) => {
          const previousUpload = previousUploads[0];
          if (previousUpload) {
            tusUpload.resumeFromPreviousUpload(previousUpload);
          } else {
            tusUpload.start();
          }
        });
      });

      await this.updateUpload(workspace, upload.file_id, {
        status: UploadStatus.Completed,
        progress: 100,
        completed_at: new Date().toISOString(),
        error_code: null,
        error_message: null,
      });

      return {
        type: 'success',
      };
    } catch {
      const newRetries = upload.retries + 1;

      if (newRetries >= UPLOAD_RETRIES_LIMIT) {
        await this.updateUpload(workspace, upload.file_id, {
          status: UploadStatus.Failed,
          completed_at: new Date().toISOString(),
          progress: 0,
          error_code: 'file_upload_failed',
          error_message:
            'Failed to upload file after ' + newRetries + ' retries',
        });

        return {
          type: 'cancel',
        };
      }

      await this.updateUpload(workspace, upload.file_id, {
        status: UploadStatus.Pending,
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

  private async fetchUpload(
    workspace: WorkspaceService,
    fileId: string
  ): Promise<SelectUpload | undefined> {
    return workspace.database
      .selectFrom('uploads')
      .selectAll()
      .where('file_id', '=', fileId)
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
      .executeTakeFirstOrThrow();

    if (!node) {
      return undefined;
    }

    return mapNode(node) as LocalFileNode;
  }

  private async fetchLocalFile(
    workspace: WorkspaceService,
    fileId: string
  ): Promise<SelectLocalFile | undefined> {
    return workspace.database
      .selectFrom('local_files')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirstOrThrow();
  }

  private async updateUpload(
    workspace: WorkspaceService,
    fileId: string,
    values: UpdateUpload
  ): Promise<void> {
    const updatedUpload = await workspace.database
      .updateTable('uploads')
      .returningAll()
      .set(values)
      .where('file_id', '=', fileId)
      .executeTakeFirst();

    if (!updatedUpload) {
      return;
    }

    eventBus.publish({
      type: 'upload.updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      upload: mapUpload(updatedUpload),
    });
  }
}
