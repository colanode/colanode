import { net, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import mime from 'mime-types';
import { FileMetadata } from '@/shared/types/files';
import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import { getWorkspaceFilesDirectoryPath } from '@/main/utils';
import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadOutput,
  extractFileType,
  FileAttributes,
} from '@colanode/core';
import { eventBus } from '@/shared/lib/event-bus';
import { serverService } from '@/main/services/server-service';
import { createLogger } from '@/main/logger';

type WorkspaceFileState = {
  isUploading: boolean;
  isDownloading: boolean;
  isUploadScheduled: boolean;
  isDownloadScheduled: boolean;
};

class FileService {
  private readonly logger = createLogger('file-service');
  private readonly fileStates: Map<string, WorkspaceFileState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'download_created') {
        this.syncWorkspaceDownloads(event.userId);
      } else if (event.type === 'upload_created') {
        this.syncWorkspaceUploads(event.userId);
      } else if (event.type === 'node_created' && event.node.type === 'file') {
        this.syncWorkspaceDownloads(event.userId);
        this.syncWorkspaceUploads(event.userId);
      } else if (event.type === 'node_updated' && event.node.type === 'file') {
        this.syncWorkspaceDownloads(event.userId);
        this.syncWorkspaceUploads(event.userId);
      } else if (event.type === 'node_deleted' && event.node.type === 'file') {
        this.syncWorkspaceDownloads(event.userId);
        this.syncWorkspaceUploads(event.userId);
      }
    });
  }

  public async handleFileRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file://', '');
    const [userId, file] = url.split('/');
    if (!userId || !file) {
      this.logger.warn(`Invalid file request url: ${url}`);
      return new Response(null, { status: 400 });
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, file);

    if (fs.existsSync(filePath)) {
      const fileUrl = `file://${filePath}`;
      return net.fetch(fileUrl);
    }

    this.logger.warn(`File ${file} not found for user ${userId}`);
    return new Response(null, { status: 404 });
  }

  public async handleFilePreviewRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file-preview://', 'file://');
    return net.fetch(url);
  }

  public copyFileToWorkspace(
    filePath: string,
    fileId: string,
    uploadId: string,
    fileExtension: string,
    userId: string
  ): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const destinationFilePath = path.join(
      filesDir,
      `${fileId}_${uploadId}${fileExtension}`
    );

    this.logger.debug(
      `Copying file ${filePath} to ${destinationFilePath} for user ${userId}`
    );
    fs.copyFileSync(filePath, destinationFilePath);
  }

  public openFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);

    this.logger.debug(`Opening file ${filePath} for user ${userId}`);
    shell.openPath(filePath);
  }

  public deleteFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);

    this.logger.debug(`Deleting file ${filePath} for user ${userId}`);
    fs.rmSync(filePath, { force: true });
  }

  public getFileMetadata(filePath: string): FileMetadata | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const mimeType = mime.lookup(filePath);
    if (mimeType === false) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const type = extractFileType(mimeType);

    this.logger.debug(`Getting file metadata for ${filePath}`);

    return {
      path: filePath,
      mimeType,
      extension: path.extname(filePath),
      name: path.basename(filePath),
      size: stats.size,
      type,
    };
  }

  public async syncFiles() {
    this.logger.info('Syncing files');

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      await this.syncWorkspaceUploads(workspace.user_id);
      await this.syncWorkspaceDownloads(workspace.user_id);
      await this.checkDeletedFiles(workspace.user_id);
    }
  }

  public async syncWorkspaceUploads(userId: string): Promise<void> {
    if (!this.fileStates.has(userId)) {
      this.fileStates.set(userId, {
        isUploading: false,
        isDownloading: false,
        isUploadScheduled: false,
        isDownloadScheduled: false,
      });
    }

    const fileState = this.fileStates.get(userId)!;
    if (fileState.isUploading) {
      fileState.isUploadScheduled = true;
      this.logger.debug(
        `Uploading files for user ${userId} is in progress, scheduling upload`
      );
      return;
    }

    fileState.isUploading = true;
    try {
      await this.uploadWorkspaceFiles(userId);
    } catch (error) {
      this.logger.error(error, `Error uploading files for user ${userId}`);
    } finally {
      fileState.isUploading = false;
      if (fileState.isUploadScheduled) {
        fileState.isUploadScheduled = false;
        this.syncWorkspaceUploads(userId);
      }
    }
  }

  public async syncWorkspaceDownloads(userId: string): Promise<void> {
    if (!this.fileStates.has(userId)) {
      this.fileStates.set(userId, {
        isUploading: false,
        isDownloading: false,
        isUploadScheduled: false,
        isDownloadScheduled: false,
      });
    }

    const fileState = this.fileStates.get(userId)!;
    if (fileState.isDownloading) {
      fileState.isDownloadScheduled = true;
      this.logger.debug(
        `Downloading files for user ${userId} is in progress, scheduling download`
      );
      return;
    }

    fileState.isDownloading = true;
    try {
      await this.downloadWorkspaceFiles(userId);
    } catch (error) {
      this.logger.error(error, `Error downloading files for user ${userId}`);
    } finally {
      fileState.isDownloading = false;
      if (fileState.isDownloadScheduled) {
        fileState.isDownloadScheduled = false;
        this.syncWorkspaceDownloads(userId);
      }
    }
  }

  private async uploadWorkspaceFiles(userId: string): Promise<void> {
    this.logger.debug(`Uploading files for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const uploads = await workspaceDatabase
      .selectFrom('uploads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'workspaces.account_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .where('workspaces.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      this.logger.warn(`Workspace not found for user ${userId}`);
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    for (const upload of uploads) {
      if (upload.retry_count >= 5) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      const file = await workspaceDatabase
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', upload.node_id)
        .executeTakeFirst();

      if (!file) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      const attributes: FileAttributes = JSON.parse(file.attributes);
      const filePath = path.join(
        filesDir,
        `${upload.node_id}_${upload.upload_id}${attributes.extension}`
      );

      if (!fs.existsSync(filePath)) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      if (!serverService.isAvailable(workspace.domain)) {
        continue;
      }

      try {
        const { data } = await httpClient.post<CreateUploadOutput>(
          `/v1/files/${workspace.workspace_id}`,
          {
            fileId: file.id,
            uploadId: upload.upload_id,
          },
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        const presignedUrl = data.url;
        const fileStream = fs.createReadStream(filePath);
        await axios.put(presignedUrl, fileStream, {
          headers: {
            'Content-Type': attributes.mimeType,
            'Content-Length': attributes.size,
          },
        });

        const { status } = await httpClient.put<CompleteUploadOutput>(
          `/v1/files/${workspace.workspace_id}/${data.uploadId}`,
          {},
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        if (status !== 200) {
          continue;
        }

        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();
      } catch (error) {
        console.log('error', error);
        await workspaceDatabase
          .updateTable('uploads')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('node_id', '=', upload.node_id)
          .execute();
      }
    }
  }

  public async downloadWorkspaceFiles(userId: string): Promise<void> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const downloads = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['workspaces.workspace_id', 'accounts.token', 'servers.domain'])
      .where('workspaces.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      this.logger.warn(`Workspace not found for user ${userId}`);
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    for (const download of downloads) {
      const file = await workspaceDatabase
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', download.node_id)
        .executeTakeFirst();

      if (!file) {
        await workspaceDatabase
          .deleteFrom('downloads')
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_deleted',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: download.progress,
            retryCount: download.retry_count,
          },
        });

        continue;
      }

      const attributes: FileAttributes = JSON.parse(file.attributes);
      const filePath = path.join(
        filesDir,
        `${download.node_id}_${download.upload_id}${attributes.extension}`
      );

      if (fs.existsSync(filePath)) {
        await workspaceDatabase
          .updateTable('downloads')
          .set({
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: 100,
            retryCount: download.retry_count,
          },
        });

        continue;
      }

      if (!serverService.isAvailable(workspace.domain)) {
        continue;
      }

      try {
        const { data } = await httpClient.get<CreateDownloadOutput>(
          `/v1/files/${workspace.workspace_id}/${download.node_id}`,
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        const presignedUrl = data.url;
        const fileStream = fs.createWriteStream(filePath);
        await axios
          .get(presignedUrl, { responseType: 'stream' })
          .then((response) => {
            response.data.pipe(fileStream);
          });

        await workspaceDatabase
          .updateTable('downloads')
          .set({ progress: 100 })
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: 100,
            retryCount: download.retry_count,
          },
        });
      } catch (error) {
        console.log('error', error);

        await workspaceDatabase
          .updateTable('downloads')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: download.progress,
            retryCount: download.retry_count + 1,
          },
        });
      }
    }
  }

  private async checkDeletedFiles(userId: string): Promise<void> {
    this.logger.debug(`Checking deleted files for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    if (!fs.existsSync(filesDir)) {
      return;
    }

    const files = fs.readdirSync(filesDir);
    while (files.length > 0) {
      const batch = files.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        fileIdMap[file.split('_')[0]!] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const downloads = await workspaceDatabase
        .selectFrom('downloads')
        .select(['node_id'])
        .where('node_id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        if (!downloads.some((d) => d.node_id === fileId)) {
          const filePath = path.join(
            getWorkspaceFilesDirectoryPath(userId),
            fileIdMap[fileId]!
          );
          fs.rmSync(filePath, { force: true });
        }
      }
    }
  }
}

export const fileService = new FileService();
