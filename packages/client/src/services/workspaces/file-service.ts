import ms from 'ms';

import {
  SelectDownload,
  SelectNode,
} from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import {
  mapDownload,
  mapLocalFile,
  mapNode,
  mapUpload,
} from '@colanode/client/lib/mappers';
import { fetchNode, fetchUserStorageUsed } from '@colanode/client/lib/utils';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
  DownloadStatus,
  LocalFile,
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

const debug = createDebugger('desktop:service:file');

export class FileService {
  private readonly app: AppService;
  private readonly workspace: WorkspaceService;
  private readonly filesDir: string;

  constructor(workspace: WorkspaceService) {
    this.app = workspace.account.app;
    this.workspace = workspace;
    this.filesDir = this.workspace.account.app.path.workspaceFiles(
      this.workspace.userId
    );
  }

  public async init(): Promise<void> {
    await this.app.fs.makeDirectory(this.filesDir);

    // if the download was interrupted, we need to reset the status on app start
    await this.workspace.database
      .updateTable('downloads')
      .set({
        status: DownloadStatus.Pending,
        started_at: null,
        completed_at: null,
        error_code: null,
        error_message: null,
      })
      .where('status', '=', DownloadStatus.Downloading)
      .execute();
  }

  public async createFile(
    fileId: string,
    tempFileId: string,
    parentId: string
  ): Promise<void> {
    const tempFile = await this.app.database
      .selectFrom('temp_files')
      .selectAll()
      .where('id', '=', tempFileId)
      .executeTakeFirst();

    if (!tempFile) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'The file you are trying to upload does not exist.'
      );
    }

    const fileSize = BigInt(tempFile.size);
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

    const destinationFilePath = this.buildFilePath(fileId, tempFile.extension);
    await this.app.fs.makeDirectory(this.filesDir);
    await this.app.fs.copy(tempFile.path, destinationFilePath);
    await this.app.fs.delete(tempFile.path);

    const attributes: FileAttributes = {
      type: 'file',
      subtype: extractFileSubtype(tempFile.mime_type),
      parentId: parentId,
      name: tempFile.name,
      originalName: tempFile.name,
      extension: tempFile.extension,
      mimeType: tempFile.mime_type,
      size: tempFile.size,
      status: FileStatus.Pending,
      version: generateId(IdType.Version),
    };

    const createdNode = await this.workspace.nodes.createNode({
      id: fileId,
      attributes: attributes,
      parentId: parentId,
    });

    const createdLocalFile = await this.workspace.database
      .insertInto('local_files')
      .returningAll()
      .values({
        id: fileId,
        version: generateId(IdType.Version),
        created_at: new Date().toISOString(),
        path: this.buildFilePath(fileId, tempFile.extension),
        opened_at: new Date().toISOString(),
        download_status: DownloadStatus.Completed,
        download_progress: 100,
        download_completed_at: new Date().toISOString(),
        download_error_code: null,
        download_error_message: null,
        download_retries: 0,
      })
      .executeTakeFirst();

    if (!createdLocalFile) {
      throw new MutationError(
        MutationErrorCode.FileCreateFailed,
        'Failed to create file state'
      );
    }

    const createdUpload = await this.workspace.database
      .insertInto('uploads')
      .returningAll()
      .values({
        file_id: fileId,
        status: UploadStatus.Pending,
        retries: 0,
        created_at: createdNode.created_at,
        progress: 0,
      })
      .executeTakeFirst();

    if (!createdUpload) {
      throw new MutationError(
        MutationErrorCode.FileCreateFailed,
        'Failed to create upload'
      );
    }

    await this.app.database
      .deleteFrom('temp_files')
      .where('id', '=', tempFileId)
      .execute();

    const url = await this.app.fs.url(createdLocalFile.path);
    eventBus.publish({
      type: 'local.file.created',
      workspace: {
        workspaceId: this.workspace.workspaceId,
        userId: this.workspace.userId,
        accountId: this.workspace.accountId,
      },
      localFile: mapLocalFile(createdLocalFile, url),
    });

    eventBus.publish({
      type: 'upload.created',
      workspace: {
        workspaceId: this.workspace.workspaceId,
        userId: this.workspace.userId,
        accountId: this.workspace.accountId,
      },
      upload: mapUpload(createdUpload),
    });

    this.app.jobs.addJob(
      {
        type: 'file.upload',
        userId: this.workspace.userId,
        fileId: fileId,
      },
      {
        delay: ms('2 seconds'),
      }
    );
  }

  public async deleteFile(node: SelectNode): Promise<void> {
    const file = mapNode(node);

    if (file.type !== 'file') {
      return;
    }

    const filePath = this.buildFilePath(file.id, file.extension);
    await this.app.fs.delete(filePath);
  }

  public async getLocalFile(
    fileId: string,
    autoDownload: boolean
  ): Promise<LocalFile | null> {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return null;
    }

    const updatedLocalFile = await this.workspace.database
      .updateTable('local_files')
      .returningAll()
      .set({
        opened_at: new Date().toISOString(),
      })
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (updatedLocalFile) {
      const url = await this.app.fs.url(updatedLocalFile.path);
      return mapLocalFile(updatedLocalFile, url);
    }

    if (!autoDownload) {
      return null;
    }

    const file = mapNode(node) as LocalFileNode;
    const now = new Date().toISOString();
    const createdLocalFile = await this.workspace.database
      .insertInto('local_files')
      .returningAll()
      .values({
        id: fileId,
        version: file.version,
        created_at: now,
        path: this.buildFilePath(fileId, file.extension),
        opened_at: now,
        download_status: DownloadStatus.Pending,
        download_progress: 0,
        download_completed_at: null,
        download_error_code: null,
        download_error_message: null,
        download_retries: 0,
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .executeTakeFirst();

    if (!createdLocalFile) {
      return null;
    }

    await this.app.jobs.addJob({
      type: 'local.file.download',
      userId: this.workspace.userId,
      fileId: fileId,
    });

    const localFile = mapLocalFile(createdLocalFile, null);
    eventBus.publish({
      type: 'local.file.created',
      workspace: {
        workspaceId: this.workspace.workspaceId,
        userId: this.workspace.userId,
        accountId: this.workspace.accountId,
      },
      localFile: localFile,
    });

    return localFile;
  }

  public async initManualDownload(
    fileId: string,
    path: string
  ): Promise<SelectDownload | null> {
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'The file you are trying to download does not exist.'
      );
    }

    const file = mapNode(node) as LocalFileNode;
    if (file.status !== FileStatus.Ready) {
      throw new MutationError(
        MutationErrorCode.FileNotReady,
        'The file you are trying to download is not uploaded by the author yet.'
      );
    }

    const name = this.app.path.filename(path);
    const createdDownload = await this.workspace.database
      .insertInto('downloads')
      .returningAll()
      .values({
        id: generateId(IdType.Download),
        file_id: fileId,
        version: file.version,
        name: name,
        path: path,
        size: file.size,
        mime_type: file.mimeType,
        status: DownloadStatus.Pending,
        progress: 0,
        retries: 0,
        created_at: new Date().toISOString(),
      })
      .executeTakeFirst();

    if (!createdDownload) {
      return null;
    }

    await this.app.jobs.addJob({
      type: 'file.download',
      userId: this.workspace.userId,
      downloadId: createdDownload.id,
    });

    eventBus.publish({
      type: 'download.created',
      workspace: {
        workspaceId: this.workspace.workspaceId,
        userId: this.workspace.userId,
        accountId: this.workspace.accountId,
      },
      download: mapDownload(createdDownload),
    });

    return createdDownload;
  }

  private buildFilePath(id: string, extension: string): string {
    return this.app.path.workspaceFile(this.workspace.userId, id, extension);
  }

  public async cleanupFiles(): Promise<void> {
    await this.cleanDeletedFiles();
    await this.cleanUnopenedFiles();
  }

  private async cleanDeletedFiles(): Promise<void> {
    debug(`Checking deleted files for workspace ${this.workspace.workspaceId}`);

    const fsFiles = await this.app.fs.listFiles(this.filesDir);
    while (fsFiles.length > 0) {
      const batch = fsFiles.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = this.app.path.filename(file);
        fileIdMap[id] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const localFiles = await this.workspace.database
        .selectFrom('local_files')
        .select(['id'])
        .where('id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const localFile = localFiles.find((lf) => lf.id === fileId);
        if (localFile) {
          continue;
        }

        const fsFile = fileIdMap[fileId]!;
        const name = this.app.path.filename(fsFile);
        const extension = this.app.path.extension(fsFile);
        const filePath = this.app.path.workspaceFile(
          this.workspace.userId,
          name,
          extension
        );
        await this.app.fs.delete(filePath);
      }
    }
  }

  private async cleanUnopenedFiles(): Promise<void> {
    debug(
      `Cleaning unopened files for workspace ${this.workspace.workspaceId}`
    );

    const sevenDaysAgo = new Date(Date.now() - ms('7 days')).toISOString();
    const unopenedFiles = await this.workspace.database
      .deleteFrom('local_files')
      .where('opened_at', '<', sevenDaysAgo)
      .returningAll()
      .execute();

    for (const localFile of unopenedFiles) {
      await this.app.fs.delete(localFile.path);

      eventBus.publish({
        type: 'local.file.deleted',
        workspace: {
          workspaceId: this.workspace.workspaceId,
          userId: this.workspace.userId,
          accountId: this.workspace.accountId,
        },
        localFile: mapLocalFile(localFile, ''),
      });
    }
  }
}
