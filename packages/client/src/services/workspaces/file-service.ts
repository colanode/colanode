import ms from 'ms';

import {
  SelectFileState,
  SelectNode,
} from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import { EventLoop } from '@colanode/client/lib/event-loop';
import { mapFileState, mapNode } from '@colanode/client/lib/mappers';
import { fetchNode, fetchUserStorageUsed } from '@colanode/client/lib/utils';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
  DownloadStatus,
  TempFile,
  UploadStatus,
} from '@colanode/client/types/files';
import { LocalFileNode } from '@colanode/client/types/nodes';
import {
  FileAttributes,
  FileStatus,
  IdType,
  createDebugger,
  extractFileSubtype,
  generateId,
  formatBytes,
} from '@colanode/core';

const UPLOAD_RETRIES_LIMIT = 10;
const DOWNLOAD_RETRIES_LIMIT = 10;

const debug = createDebugger('desktop:service:file');

export class FileService {
  private readonly app: AppService;
  private readonly workspace: WorkspaceService;
  private readonly filesDir: string;

  private readonly uploadsEventLoop: EventLoop;
  private readonly downloadsEventLoop: EventLoop;
  private readonly cleanupEventLoop: EventLoop;

  constructor(workspace: WorkspaceService) {
    this.app = workspace.account.app;
    this.workspace = workspace;
    this.filesDir = this.workspace.account.app.path.workspaceFiles(
      this.workspace.accountId,
      this.workspace.id
    );

    this.app.fs.makeDirectory(this.filesDir);

    this.uploadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.uploadFiles.bind(this)
    );

    this.downloadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.downloadFiles.bind(this)
    );

    this.cleanupEventLoop = new EventLoop(
      ms('10 minutes'),
      ms('5 minutes'),
      this.cleanDeletedFiles.bind(this)
    );

    this.uploadsEventLoop.start();
    this.downloadsEventLoop.start();
    this.cleanupEventLoop.start();
  }

  public async createFile(
    id: string,
    parentId: string,
    file: TempFile
  ): Promise<void> {
    const fileSize = BigInt(file.size);
    const maxFileSize = BigInt(this.workspace.maxFileSize);
    if (fileSize > maxFileSize) {
      throw new MutationError(
        MutationErrorCode.FileTooLarge,
        'The file you are trying to upload is too large. The maximum file size is ' +
          formatBytes(maxFileSize)
      );
    }

    const storageUsed = await fetchUserStorageUsed(
      this.workspace.database,
      this.workspace.userId
    );

    const storageLimit = BigInt(this.workspace.storageLimit);
    if (storageUsed + fileSize > storageLimit) {
      throw new MutationError(
        MutationErrorCode.StorageLimitExceeded,
        'You have reached your storage limit. You have used ' +
          formatBytes(storageUsed) +
          ' and you are trying to upload a file of size ' +
          formatBytes(fileSize) +
          '. Your storage limit is ' +
          formatBytes(storageLimit)
      );
    }

    const node = await fetchNode(this.workspace.database, parentId);
    if (!node) {
      throw new MutationError(
        MutationErrorCode.NodeNotFound,
        'There was an error while creating the file. Please make sure you have access to this node.'
      );
    }

    const destinationFilePath = this.buildFilePath(id, file.extension);
    await this.app.fs.makeDirectory(this.filesDir);
    await this.app.fs.copy(file.path, destinationFilePath);
    await this.app.fs.delete(file.path);

    const attributes: FileAttributes = {
      type: 'file',
      subtype: extractFileSubtype(file.mimeType),
      parentId: parentId,
      name: file.name,
      originalName: file.name,
      extension: file.extension,
      mimeType: file.mimeType,
      size: file.size,
      status: FileStatus.Pending,
      version: generateId(IdType.Version),
    };

    await this.workspace.nodes.createNode({
      id: id,
      attributes: attributes,
      parentId: parentId,
    });

    const createdFileState = await this.workspace.database
      .insertInto('file_states')
      .returningAll()
      .values({
        id: id,
        version: attributes.version,
        download_progress: 100,
        download_status: DownloadStatus.Completed,
        download_completed_at: new Date().toISOString(),
        upload_progress: 0,
        upload_status: UploadStatus.Pending,
        upload_retries: 0,
        upload_started_at: new Date().toISOString(),
      })
      .executeTakeFirst();

    if (!createdFileState) {
      throw new MutationError(
        MutationErrorCode.FileCreateFailed,
        'Failed to create file state'
      );
    }

    eventBus.publish({
      type: 'file.state.updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileState: mapFileState(createdFileState),
    });

    this.triggerUploads();
  }

  public async deleteFile(node: SelectNode): Promise<void> {
    const file = mapNode(node);

    if (file.type !== 'file') {
      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    await this.app.fs.delete(filePath);
  }

  public triggerUploads(): void {
    this.uploadsEventLoop.trigger();
  }

  public triggerDownloads(): void {
    this.downloadsEventLoop.trigger();
  }

  public destroy(): void {
    this.uploadsEventLoop.stop();
    this.downloadsEventLoop.stop();
    this.cleanupEventLoop.stop();
  }

  private async uploadFiles(): Promise<void> {
    if (!this.workspace.account.server.isAvailable) {
      return;
    }

    debug(`Uploading files for workspace ${this.workspace.id}`);

    const uploads = await this.workspace.database
      .selectFrom('file_states')
      .selectAll()
      .where('upload_status', '=', UploadStatus.Pending)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    for (const upload of uploads) {
      await this.uploadFile(upload);
    }
  }

  private async uploadFile(state: SelectFileState): Promise<void> {
    if (state.upload_retries && state.upload_retries >= UPLOAD_RETRIES_LIMIT) {
      debug(`File ${state.id} upload retries limit reached, marking as failed`);

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Failed,
          upload_retries: state.upload_retries + 1,
        })
        .where('id', '=', state.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', state.id)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    const file = mapNode(node) as LocalFileNode;
    if (node.server_revision === '0') {
      // file is not synced with the server, we need to wait for the sync to complete
      return;
    }

    if (file.attributes.status === FileStatus.Ready) {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          upload_completed_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    const exists = await this.app.fs.exists(filePath);
    if (!exists) {
      debug(`File ${file.id} not found`);
      return;
    }

    try {
      const fileStream = await this.app.fs.readStream(filePath);

      await this.workspace.account.client.put(
        `v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {
          body: fileStream,
          headers: {
            'Content-Type': file.attributes.mimeType,
            'Content-Length': file.attributes.size.toString(),
          },
        }
      );

      const finalFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          upload_completed_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (finalFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(finalFileState),
        });
      }

      debug(`File ${file.id} uploaded successfully`);
    } catch (error) {
      debug(`Error uploading file ${file.id}: ${error}`);

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set((eb) => ({ upload_retries: eb('upload_retries', '+', 1) }))
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    }
  }

  public async downloadFiles(): Promise<void> {
    if (!this.workspace.account.server.isAvailable) {
      return;
    }

    debug(`Downloading files for workspace ${this.workspace.id}`);

    const downloads = await this.workspace.database
      .selectFrom('file_states')
      .selectAll()
      .where('download_status', '=', DownloadStatus.Pending)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    for (const download of downloads) {
      await this.downloadFile(download);
    }
  }

  private async downloadFile(fileState: SelectFileState): Promise<void> {
    if (
      fileState.download_retries &&
      fileState.download_retries >= DOWNLOAD_RETRIES_LIMIT
    ) {
      debug(
        `File ${fileState.id} download retries limit reached, marking as failed`
      );

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          download_status: DownloadStatus.Failed,
          download_retries: fileState.download_retries + 1,
        })
        .where('id', '=', fileState.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileState.id)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    const file = mapNode(node) as LocalFileNode;

    if (node.server_revision === '0') {
      // file is not synced with the server, we need to wait for the sync to complete
      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    const exists = await this.app.fs.exists(filePath);
    if (exists) {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          download_completed_at: new Date().toISOString(),
        })
        .where('id', '=', fileState.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    try {
      const response = await this.workspace.account.client.get(
        `v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {
          onDownloadProgress: async (progress, _chunk) => {
            const percent = Math.round((progress.percent || 0) * 100);

            const updatedFileState = await this.workspace.database
              .updateTable('file_states')
              .returningAll()
              .set({
                download_progress: percent,
              })
              .where('id', '=', file.id)
              .executeTakeFirst();

            if (!updatedFileState) {
              return;
            }

            eventBus.publish({
              type: 'file.state.updated',
              accountId: this.workspace.accountId,
              workspaceId: this.workspace.id,
              fileState: mapFileState(updatedFileState),
            });
          },
        }
      );

      const writeStream = await this.app.fs.writeStream(filePath);
      await response.body?.pipeTo(writeStream);

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          download_completed_at: new Date().toISOString(),
        })
        .where('id', '=', fileState.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    } catch {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set((eb) => ({ download_retries: eb('download_retries', '+', 1) }))
        .where('id', '=', fileState.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file.state.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    }
  }

  public async cleanDeletedFiles(): Promise<void> {
    debug(`Checking deleted files for workspace ${this.workspace.id}`);

    const fsFiles = await this.app.fs.listFiles(this.filesDir);
    while (fsFiles.length > 0) {
      const batch = fsFiles.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = this.app.path.filename(file);
        fileIdMap[id] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const fileStates = await this.workspace.database
        .selectFrom('file_states')
        .select(['id'])
        .where('id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const fileState = fileStates.find((f) => f.id === fileId);
        if (fileState) {
          continue;
        }

        const filePath = this.app.path.join(this.filesDir, fileIdMap[fileId]!);
        await this.app.fs.delete(filePath);
      }
    }
  }

  private buildFilePath(id: string, extension: string): string {
    return this.app.path.join(this.filesDir, `${id}${extension}`);
  }
}
