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

type WorkspaceFileState = {
  isUploading: boolean;
  isDownloading: boolean;
  isUploadScheduled: boolean;
  isDownloadScheduled: boolean;
};

class FileService {
  private fileStates: Map<string, WorkspaceFileState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'download_created') {
        this.syncWorkspaceDownloads(event.userId);
      } else if (event.type === 'upload_created') {
        this.syncWorkspaceUploads(event.userId);
      }
    });
  }

  public async handleFileRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file://', '');
    const [userId, file] = url.split('/');
    if (!userId || !file) {
      return new Response(null, { status: 400 });
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, file);

    if (fs.existsSync(filePath)) {
      const fileUrl = `file://${filePath}`;
      return net.fetch(fileUrl);
    }

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
    fs.copyFileSync(filePath, destinationFilePath);
  }

  public openFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);
    shell.openPath(filePath);
  }

  public deleteFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);
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
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.uploadWorkspaceFiles(workspace.user_id);
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
      return;
    }

    fileState.isUploading = true;
    try {
      await this.uploadWorkspaceFiles(userId);
    } catch (error) {
      console.log('error', error);
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
      return;
    }

    fileState.isDownloading = true;
    try {
      await this.downloadWorkspaceFiles(userId);
    } catch (error) {
      console.log('error', error);
    } finally {
      fileState.isDownloading = false;
      if (fileState.isDownloadScheduled) {
        fileState.isDownloadScheduled = false;
        this.syncWorkspaceDownloads(userId);
      }
    }
  }

  private async uploadWorkspaceFiles(userId: string): Promise<void> {
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
      return;
    }

    fileState.isUploading = true;

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
}

export const fileService = new FileService();
