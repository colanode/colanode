import {
  CompleteUploadInput,
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadInput,
  CreateUploadOutput,
  FileAttributes,
  FileStatus,
  IdType,
  createDebugger,
  extractFileSubtype,
  generateId,
} from '@colanode/core';
import axios from 'axios';
import ms from 'ms';

import fs from 'fs';
import path from 'path';

import {
  fetchNode,
  fetchUserStorageUsed,
  getFileMetadata,
  getWorkspaceFilesDirectoryPath,
  getWorkspaceTempFilesDirectoryPath,
} from '@/main/lib/utils';
import { mapFileState, mapNode } from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { EventLoop } from '@/main/lib/event-loop';
import { SelectFileState, SelectNode } from '@/main/databases/workspace';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { formatBytes } from '@/shared/lib/files';
import { LocalFileNode } from '@/shared/types/nodes';

const UPLOAD_RETRIES_LIMIT = 10;
const DOWNLOAD_RETRIES_LIMIT = 10;

const debug = createDebugger('desktop:service:file');

export class FileService {
  private readonly workspace: WorkspaceService;
  private readonly filesDir: string;
  private readonly tempFilesDir: string;

  private readonly uploadsEventLoop: EventLoop;
  private readonly downloadsEventLoop: EventLoop;
  private readonly cleanupEventLoop: EventLoop;

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
    this.filesDir = getWorkspaceFilesDirectoryPath(
      this.workspace.accountId,
      this.workspace.id
    );

    this.tempFilesDir = getWorkspaceTempFilesDirectoryPath(
      this.workspace.accountId,
      this.workspace.id
    );

    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }

    if (!fs.existsSync(this.tempFilesDir)) {
      fs.mkdirSync(this.tempFilesDir, { recursive: true });
    }

    this.uploadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      () => {
        this.uploadFiles();
      }
    );

    this.downloadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      () => {
        this.downloadFiles();
      }
    );

    this.cleanupEventLoop = new EventLoop(
      ms('10 minutes'),
      ms('5 minutes'),
      () => {
        this.cleanDeletedFiles();
        this.cleanTempFiles();
      }
    );

    this.uploadsEventLoop.start();
    this.downloadsEventLoop.start();
    this.cleanupEventLoop.start();
  }

  public async createFile(
    id: string,
    parentId: string,
    path: string
  ): Promise<void> {
    const metadata = getFileMetadata(path);
    if (!metadata) {
      throw new MutationError(
        MutationErrorCode.FileInvalid,
        'File is invalid or could not be read.'
      );
    }

    const fileSize = BigInt(metadata.size);
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

    this.copyFileToWorkspace(path, id, metadata.extension);

    const attributes: FileAttributes = {
      type: 'file',
      subtype: extractFileSubtype(metadata.mimeType),
      parentId: parentId,
      name: metadata.name,
      originalName: metadata.name,
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      size: metadata.size,
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
      type: 'file_state_updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileState: mapFileState(createdFileState),
    });

    this.triggerUploads();
  }

  public deleteFile(node: SelectNode): void {
    const file = mapNode(node);

    if (file.type !== 'file') {
      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    fs.rmSync(filePath, { force: true });
  }

  private copyFileToWorkspace(
    filePath: string,
    fileId: string,
    fileExtension: string
  ): void {
    const destinationFilePath = this.buildFilePath(fileId, fileExtension);

    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }

    debug(`Copying file ${filePath} to ${destinationFilePath}`);
    fs.copyFileSync(filePath, destinationFilePath);

    // check if the file is in the temp files directory. If it is in
    // temp files directory it means it has been pasted or dragged
    // therefore we need to delete it
    const fileDirectory = path.dirname(filePath);
    if (fileDirectory === this.tempFilesDir) {
      fs.rmSync(filePath);
    }
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
          type: 'file_state_updated',
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
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);

    if (!fs.existsSync(filePath)) {
      debug(`File ${file.id} not found, deleting from database`);
      return;
    }

    try {
      const createUploadInput: CreateUploadInput = {
        fileId: file.id,
      };

      const { data } =
        await this.workspace.account.client.post<CreateUploadOutput>(
          `/v1/workspaces/${this.workspace.id}/files`,
          createUploadInput
        );

      const presignedUrl = data.url;
      const fileStream = fs.createReadStream(filePath);

      let lastProgress = 0;
      await axios.put(presignedUrl, fileStream, {
        headers: {
          'Content-Type': file.attributes.mimeType,
          'Content-Length': file.attributes.size,
        },
        onUploadProgress: async (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded / file.attributes.size) * 100
          );

          if (progress >= lastProgress) {
            return;
          }

          lastProgress = progress;

          const updatedFileState = await this.workspace.database
            .updateTable('file_states')
            .returningAll()
            .set({
              upload_progress: progress,
            })
            .where('id', '=', file.id)
            .executeTakeFirst();

          if (!updatedFileState) {
            return;
          }

          eventBus.publish({
            type: 'file_state_updated',
            accountId: this.workspace.accountId,
            workspaceId: this.workspace.id,
            fileState: mapFileState(updatedFileState),
          });
        },
      });

      const completeUploadInput: CompleteUploadInput = {
        uploadId: data.uploadId,
      };

      await this.workspace.account.client.put<CompleteUploadOutput>(
        `/v1/workspaces/${this.workspace.id}/files/${file.id}`,
        completeUploadInput
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
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(finalFileState),
        });
      }

      debug(`File ${file.id} uploaded successfully`);
    } catch {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set((eb) => ({ upload_retries: eb('upload_retries', '+', 1) }))
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
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
          type: 'file_state_updated',
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
    if (fs.existsSync(filePath)) {
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
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    try {
      const { data } =
        await this.workspace.account.client.get<CreateDownloadOutput>(
          `/v1/workspaces/${this.workspace.id}/downloads/${file.id}`
        );

      const presignedUrl = data.url;
      const fileStream = fs.createWriteStream(filePath);
      let lastProgress = 0;

      await axios
        .get(presignedUrl, {
          responseType: 'stream',
          onDownloadProgress: async (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / file.attributes.size) * 100
            );

            if (progress <= lastProgress) {
              return;
            }

            lastProgress = progress;

            const updatedFileState = await this.workspace.database
              .updateTable('file_states')
              .returningAll()
              .set({
                download_progress: progress,
              })
              .where('id', '=', fileState.id)
              .executeTakeFirst();

            if (updatedFileState) {
              eventBus.publish({
                type: 'file_state_updated',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                fileState: mapFileState(updatedFileState),
              });
            }
          },
        })
        .then((response) => {
          response.data.pipe(fileStream);
        });

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
          type: 'file_state_updated',
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
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    }
  }

  public async cleanDeletedFiles(): Promise<void> {
    debug(`Checking deleted files for workspace ${this.workspace.id}`);

    const fsFiles = fs.readdirSync(this.filesDir);
    while (fsFiles.length > 0) {
      const batch = fsFiles.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = path.parse(file).name;
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

        const filePath = path.join(this.filesDir, fileIdMap[fileId]!);
        fs.rmSync(filePath, { force: true });
      }
    }
  }

  public async cleanTempFiles(): Promise<void> {
    debug(`Checking temp files for workspace ${this.workspace.id}`);

    if (!fs.existsSync(this.tempFilesDir)) {
      return;
    }

    const files = fs.readdirSync(this.tempFilesDir);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const file of files) {
      const filePath = path.join(this.tempFilesDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < oneDayAgo) {
        try {
          fs.unlinkSync(filePath);
          debug(`Deleted old temp file: ${filePath}`);
        } catch (error) {
          debug(`Failed to delete temp file: ${filePath}`, error);
        }
      }
    }
  }

  private buildFilePath(id: string, extension: string): string {
    return path.join(this.filesDir, `${id}${extension}`);
  }
}
