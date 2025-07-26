import AsyncLock from 'async-lock';
import ms from 'ms';

import {
  SelectDownload,
  SelectNode,
  UpdateDownload,
  UpdateUpload,
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
  DownloadType,
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
  private readonly lock = new AsyncLock();

  constructor(workspace: WorkspaceService) {
    this.app = workspace.account.app;
    this.workspace = workspace;
    this.filesDir = this.workspace.account.app.path.workspaceFiles(
      this.workspace.accountId,
      this.workspace.id
    );

    this.app.fs.makeDirectory(this.filesDir);
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
        name: tempFile.name,
        extension: tempFile.extension,
        subtype: tempFile.subtype,
        mime_type: tempFile.mime_type,
        size: tempFile.size,
        created_at: new Date().toISOString(),
        path: this.buildFilePath(fileId, tempFile.extension),
        opened_at: new Date().toISOString(),
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
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      localFile: mapLocalFile(createdLocalFile, url),
    });

    eventBus.publish({
      type: 'upload.created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      upload: mapUpload(createdUpload),
    });

    this.app.jobs.addJob({
      type: 'file.upload',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileId: fileId,
    });
  }

  public async deleteFile(node: SelectNode): Promise<void> {
    const file = mapNode(node);

    if (file.type !== 'file') {
      return;
    }

    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    await this.app.fs.delete(filePath);
  }

  public async uploadFile(fileId: string): Promise<boolean | null> {
    if (!this.workspace.account.server.isAvailable) {
      return false;
    }

    const upload = await this.workspace.database
      .selectFrom('uploads')
      .selectAll()
      .where('file_id', '=', fileId)
      .executeTakeFirst();

    if (!upload) {
      return null;
    }

    if (upload.status === UploadStatus.Completed) {
      return true;
    }

    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!node) {
      return null;
    }

    if (node.server_revision === '0') {
      // file is not synced with the server, we need to wait for the sync to complete
      return false;
    }

    const localFile = await this.workspace.database
      .selectFrom('local_files')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!localFile) {
      return null;
    }

    const exists = await this.app.fs.exists(localFile.path);
    if (!exists) {
      debug(`Local file ${localFile.id} not found on disk`);

      const updatedUpload = await this.workspace.database
        .updateTable('uploads')
        .returningAll()
        .set({
          status: UploadStatus.Failed,
          error_code: 'file_upload_failed',
          error_message: 'File not found on disk',
        })
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (updatedUpload) {
        eventBus.publish({
          type: 'upload.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          upload: mapUpload(updatedUpload),
        });
      }

      return null;
    }

    try {
      const fileStream = await this.app.fs.readStream(localFile.path);

      await this.workspace.account.client.put(
        `v1/workspaces/${this.workspace.id}/files/${localFile.id}`,
        {
          body: fileStream,
          headers: {
            'Content-Type': localFile.mime_type,
            'Content-Length': localFile.size.toString(),
          },
        }
      );

      const finalUpload = await this.workspace.database
        .updateTable('uploads')
        .returningAll()
        .set({
          status: UploadStatus.Completed,
          progress: 100,
          completed_at: new Date().toISOString(),
          error_code: null,
          error_message: null,
        })
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (finalUpload) {
        eventBus.publish({
          type: 'upload.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          upload: mapUpload(finalUpload),
        });
      }

      debug(`Local file ${localFile.id} uploaded successfully`);
      return true;
    } catch (error) {
      debug(`Error uploading local file ${localFile.id}: ${error}`);

      const updateUpload: UpdateUpload = {};
      const newRetries = upload.retries + 1;

      if (newRetries >= UPLOAD_RETRIES_LIMIT) {
        updateUpload.status = UploadStatus.Failed;
      } else {
        updateUpload.retries = newRetries;
        updateUpload.error_code = 'file_upload_failed';
        updateUpload.error_message =
          'Failed to upload file after ' + newRetries + ' retries';
      }

      const updatedUpload = await this.workspace.database
        .updateTable('uploads')
        .returningAll()
        .set(updateUpload)
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      if (updatedUpload) {
        eventBus.publish({
          type: 'upload.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          upload: mapUpload(updatedUpload),
        });
      }
    }

    return false;
  }

  public async initAutoDownload(
    fileId: string
  ): Promise<SelectDownload | null> {
    const lockKey = `download.auto.${fileId}`;

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
    if (file.attributes.status !== FileStatus.Ready) {
      throw new MutationError(
        MutationErrorCode.FileNotReady,
        'The file you are trying to download is not uploaded by the author yet.'
      );
    }

    const result = await this.lock.acquire(lockKey, async () => {
      const existingDownload = await this.workspace.database
        .selectFrom('downloads')
        .selectAll()
        .where('file_id', '=', fileId)
        .where('type', '=', DownloadType.Auto)
        .executeTakeFirst();

      if (existingDownload) {
        return { existingDownload };
      }

      const createdDownload = await this.workspace.database
        .insertInto('downloads')
        .returningAll()
        .values({
          id: generateId(IdType.Download),
          file_id: fileId,
          version: file.attributes.version,
          type: DownloadType.Auto,
          path: this.buildFilePath(fileId, file.attributes.extension),
          size: file.attributes.size,
          mime_type: file.attributes.mimeType,
          status: DownloadStatus.Pending,
          progress: 0,
          retries: 0,
          created_at: new Date().toISOString(),
        })
        .executeTakeFirst();

      if (!createdDownload) {
        return null;
      }

      return { createdDownload };
    });

    if (!result) {
      return null;
    }

    if (result.existingDownload) {
      return result.existingDownload;
    }

    if (result.createdDownload) {
      await this.app.jobs.addJob({
        type: 'file.download',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        downloadId: result.createdDownload.id,
      });

      eventBus.publish({
        type: 'download.created',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        download: mapDownload(result.createdDownload),
      });
    }

    return result.createdDownload;
  }

  public async initManualDownload(
    fileId: string
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
    if (file.attributes.status !== FileStatus.Ready) {
      throw new MutationError(
        MutationErrorCode.FileNotReady,
        'The file you are trying to download is not uploaded by the author yet.'
      );
    }

    const createdDownload = await this.workspace.database
      .insertInto('downloads')
      .returningAll()
      .values({
        id: generateId(IdType.Download),
        file_id: fileId,
        version: file.attributes.version,
        type: DownloadType.Auto,
        path: this.buildFilePath(fileId, file.attributes.extension),
        size: file.attributes.size,
        mime_type: file.attributes.mimeType,
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
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      downloadId: createdDownload.id,
    });

    eventBus.publish({
      type: 'download.created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      download: mapDownload(createdDownload),
    });

    return createdDownload;
  }

  public async downloadFile(id: string): Promise<boolean | null> {
    if (!this.workspace.account.server.isAvailable) {
      return false;
    }

    const download = await this.workspace.database
      .selectFrom('downloads')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!download) {
      return null;
    }

    if (download.status === DownloadStatus.Completed) {
      return true;
    }

    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', download.file_id)
      .executeTakeFirst();

    if (!node) {
      return false;
    }

    const file = mapNode(node) as LocalFileNode;

    if (file.attributes.status === FileStatus.Pending) {
      return false;
    }

    try {
      const response = await this.workspace.account.client.get(
        `v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {
          onDownloadProgress: async (progress, _chunk) => {
            const percent = Math.round((progress.percent || 0) * 100);

            const updatedDownload = await this.workspace.database
              .updateTable('downloads')
              .returningAll()
              .set({
                progress: percent,
              })
              .where('id', '=', download.id)
              .executeTakeFirst();

            if (!updatedDownload) {
              return;
            }

            eventBus.publish({
              type: 'download.updated',
              accountId: this.workspace.accountId,
              workspaceId: this.workspace.id,
              download: mapDownload(updatedDownload),
            });
          },
        }
      );

      const writeStream = await this.app.fs.writeStream(download.path);
      await response.body?.pipeTo(writeStream);

      const { updatedDownload, createdLocalFile } =
        await this.workspace.database.transaction().execute(async (trx) => {
          const updatedDownload = await trx
            .updateTable('downloads')
            .returningAll()
            .set({
              status: DownloadStatus.Completed,
              completed_at: new Date().toISOString(),
              progress: 100,
              error_code: null,
              error_message: null,
            })
            .where('id', '=', download.id)
            .executeTakeFirst();

          if (download.type === DownloadType.Manual) {
            return { updatedDownload, createdFile: null };
          }

          const createdLocalFile = await trx
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

          return { updatedDownload, createdLocalFile };
        });

      if (updatedDownload) {
        eventBus.publish({
          type: 'download.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          download: mapDownload(updatedDownload),
        });
      }

      if (createdLocalFile) {
        const url = await this.app.fs.url(createdLocalFile.path);
        eventBus.publish({
          type: 'local.file.created',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          localFile: mapLocalFile(createdLocalFile, url),
        });
      }

      return true;
    } catch {
      const updateDownload: UpdateDownload = {};
      const newRetries = download.retries + 1;

      if (newRetries >= DOWNLOAD_RETRIES_LIMIT) {
        updateDownload.status = DownloadStatus.Failed;
      } else {
        updateDownload.retries = newRetries;
        updateDownload.error_code = 'file_download_failed';
        updateDownload.error_message =
          'Failed to download file after ' + newRetries + ' retries';
      }

      const updatedDownload = await this.workspace.database
        .updateTable('downloads')
        .returningAll()
        .set(updateDownload)
        .where('id', '=', download.id)
        .executeTakeFirst();

      if (updatedDownload) {
        eventBus.publish({
          type: 'download.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          download: mapDownload(updatedDownload),
        });
      }
    }

    return false;
  }

  private buildFilePath(id: string, extension: string): string {
    return this.app.path.join(this.filesDir, `${id}${extension}`);
  }

  public async cleanupFiles(): Promise<void> {
    await this.cleanDeletedFiles();
    await this.cleanUnopenedFiles();
  }

  private async cleanDeletedFiles(): Promise<void> {
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

        const filePath = this.app.path.join(this.filesDir, fileIdMap[fileId]!);
        await this.app.fs.delete(filePath);
      }
    }
  }

  private async cleanUnopenedFiles(): Promise<void> {
    debug(`Cleaning unopened files for workspace ${this.workspace.id}`);

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
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        localFile: mapLocalFile(localFile, ''),
      });
    }
  }
}
