import ms from 'ms';

import {
  SelectNode,
  UpdateDownload,
  UpdateUpload,
} from '@colanode/client/databases/workspace';
import { eventBus } from '@colanode/client/lib/event-bus';
import {
  mapDownload,
  mapFile,
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

    const createdNode = await this.workspace.nodes.createNode({
      id: id,
      attributes: attributes,
      parentId: parentId,
    });

    const createdFile = await this.workspace.database
      .insertInto('files')
      .returningAll()
      .values({
        id: id,
        version: attributes.version,
        name: attributes.name,
        mime_type: attributes.mimeType,
        size: attributes.size,
        created_at: createdNode.created_at,
        path: destinationFilePath,
      })
      .executeTakeFirst();

    if (!createdFile) {
      throw new MutationError(
        MutationErrorCode.FileCreateFailed,
        'Failed to create file state'
      );
    }

    const createdUpload = await this.workspace.database
      .insertInto('uploads')
      .returningAll()
      .values({
        file_id: id,
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

    eventBus.publish({
      type: 'file.created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      file: mapFile(createdFile),
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
      fileId: id,
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

    const file = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!file) {
      return null;
    }

    const exists = await this.app.fs.exists(file.path);
    if (!exists) {
      debug(`File ${file.id} not found on disk`);

      await this.workspace.database
        .updateTable('uploads')
        .returningAll()
        .set({
          status: UploadStatus.Failed,
          error_code: 'file_upload_failed',
          error_message: 'File not found on disk',
        })
        .where('file_id', '=', fileId)
        .executeTakeFirst();

      return null;
    }

    try {
      const fileStream = await this.app.fs.readStream(file.path);

      await this.workspace.account.client.put(
        `v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {
          body: fileStream,
          headers: {
            'Content-Type': file.mime_type,
            'Content-Length': file.size.toString(),
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

      debug(`File ${file.id} uploaded successfully`);
      return true;
    } catch (error) {
      debug(`Error uploading file ${file.id}: ${error}`);

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

  public async downloadFile(id: string): Promise<boolean | null> {
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

      const { updatedDownload, createdFile } = await this.workspace.database
        .transaction()
        .execute(async (trx) => {
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

          const createdFile = await trx
            .insertInto('files')
            .returningAll()
            .values({
              id: file.id,
              version: file.attributes.version,
              name: file.attributes.name,
              mime_type: file.attributes.mimeType,
              size: file.attributes.size,
              created_at: new Date().toISOString(),
              path: download.path,
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

          return { updatedDownload, createdFile };
        });

      if (updatedDownload) {
        eventBus.publish({
          type: 'download.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          download: mapDownload(updatedDownload),
        });
      }

      if (createdFile) {
        eventBus.publish({
          type: 'file.created',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(createdFile),
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
    await this.cleanOldDownloadedFiles();
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
      const files = await this.workspace.database
        .selectFrom('files')
        .select(['id'])
        .where('id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const file = files.find((f) => f.id === fileId);
        if (file) {
          continue;
        }

        const filePath = this.app.path.join(this.filesDir, fileIdMap[fileId]!);
        await this.app.fs.delete(filePath);
      }
    }
  }

  private async cleanOldDownloadedFiles(): Promise<void> {
    debug(`Cleaning old downloaded files for workspace ${this.workspace.id}`);

    const sevenDaysAgo = new Date(Date.now() - ms('7 days')).toISOString();
    let lastId = '';
    const batchSize = 100;

    let hasMoreFiles = true;
    while (hasMoreFiles) {
      let query = this.workspace.database
        .selectFrom('files')
        .select(['id', 'path'])
        .orderBy('id', 'asc')
        .limit(batchSize);

      if (lastId) {
        query = query.where('id', '>', lastId);
      }

      const files = await query.execute();
      if (files.length === 0) {
        hasMoreFiles = false;
        continue;
      }

      const fileIds = files.map((f) => f.id);

      const fileInteractions = await this.workspace.database
        .selectFrom('node_interactions')
        .select(['node_id', 'last_opened_at'])
        .where('node_id', 'in', fileIds)
        .where('collaborator_id', '=', this.workspace.userId)
        .execute();

      const nodes = await this.workspace.database
        .selectFrom('nodes')
        .select(['id'])
        .where('id', 'in', fileIds)
        .execute();

      const uploads = await this.workspace.database
        .selectFrom('uploads')
        .select(['file_id', 'status'])
        .where('file_id', 'in', fileIds)
        .execute();

      const interactionMap = new Map(
        fileInteractions.map((fi) => [fi.node_id, fi.last_opened_at])
      );
      const nodeSet = new Set(nodes.map((n) => n.id));
      const uploadMap = new Map(uploads.map((u) => [u.file_id, u.status]));

      for (const file of files) {
        try {
          const uploadStatus = uploadMap.get(file.id);
          if (
            uploadStatus === UploadStatus.Pending ||
            uploadStatus === UploadStatus.Failed
          ) {
            continue;
          }

          let shouldDelete = false;

          const nodeExists = nodeSet.has(file.id);
          if (!nodeExists) {
            shouldDelete = true;
          }

          const lastOpenedAt = interactionMap.get(file.id);
          if (!lastOpenedAt || lastOpenedAt < sevenDaysAgo) {
            shouldDelete = true;
          }

          const exists = await this.app.fs.exists(file.path);
          if (!exists) {
            shouldDelete = true;
          }

          if (!shouldDelete) {
            continue;
          }

          const deleted = await this.workspace.database
            .deleteFrom('files')
            .returningAll()
            .where('id', '=', file.id)
            .executeTakeFirst();

          if (deleted) {
            eventBus.publish({
              type: 'file.deleted',
              accountId: this.workspace.accountId,
              workspaceId: this.workspace.id,
              file: mapFile(deleted),
            });
          }

          if (exists) {
            await this.app.fs.delete(file.path);
          }
        } catch {
          continue;
        }
      }

      lastId = files[files.length - 1]!.id;
      if (files.length < batchSize) {
        hasMoreFiles = false;
      }
    }
  }
}
