import { net, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import mime from 'mime-types';
import {
  FileMetadata,
  ServerFileDownloadResponse,
  ServerFileUploadResponse,
} from '@/shared/types/files';
import { WorkspaceCredentials } from '@/shared/types/workspaces';
import { databaseService } from '@/main/data/database-service';
import { httpClient } from '@/shared/lib/http-client';
import { getWorkspaceFilesDirectoryPath } from '@/main/utils';
import { FileAttributes } from '@colanode/core';
import { eventBus } from '@/shared/lib/event-bus';
import { serverService } from '@/main/services/server-service';

class FileService {
  public async handleFileRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file://', '');
    const [userId, file] = url.split('/');
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
    fileExtension: string,
    userId: string
  ): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const destinationFilePath = path.join(
      filesDir,
      `${fileId}${fileExtension}`
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

    return {
      path: filePath,
      mimeType,
      extension: path.extname(filePath),
      name: path.basename(filePath),
      size: stats.size,
    };
  }

  public async checkForUploads(
    credentials: WorkspaceCredentials
  ): Promise<void> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      credentials.userId
    );

    const uploads = await workspaceDatabase
      .selectFrom('uploads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(credentials.userId);
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
        `${upload.node_id}${attributes.extension}`
      );

      if (!fs.existsSync(filePath)) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.post<ServerFileUploadResponse>(
          `/v1/files/${credentials.workspaceId}/${upload.node_id}`,
          {},
          {
            domain: credentials.serverDomain,
            token: credentials.token,
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

  public async checkForDownloads(
    credentials: WorkspaceCredentials
  ): Promise<void> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      credentials.userId
    );

    const downloads = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(credentials.userId);
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

        await eventBus.publish({
          type: 'download_deleted',
          userId: credentials.userId,
          download: {
            nodeId: download.node_id,
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
        `${download.node_id}${attributes.extension}`
      );

      if (fs.existsSync(filePath)) {
        await workspaceDatabase
          .updateTable('downloads')
          .set({
            progress: 100,
          })
          .where('node_id', '=', download.node_id)
          .execute();

        await eventBus.publish({
          type: 'download_updated',
          userId: credentials.userId,
          download: {
            nodeId: download.node_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: 100,
            retryCount: download.retry_count,
          },
        });

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.get<ServerFileDownloadResponse>(
          `/v1/files/${credentials.workspaceId}/${download.node_id}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
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

        await eventBus.publish({
          type: 'download_updated',
          userId: credentials.userId,
          download: {
            nodeId: download.node_id,
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

        await eventBus.publish({
          type: 'download_updated',
          userId: credentials.userId,
          download: {
            nodeId: download.node_id,
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
