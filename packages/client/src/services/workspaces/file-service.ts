import { cloneDeep } from 'lodash-es';
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
  FileSaveState,
  SaveStatus,
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
  private readonly saves: FileSaveState[] = [];

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
      ms('5 minutes'),
      ms('1 minute'),
      this.cleanupFiles.bind(this)
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

    const url = await this.app.fs.url(destinationFilePath);
    eventBus.publish({
      type: 'file.state.updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileState: mapFileState(createdFileState, url),
    });

    this.triggerUploads();
  }

  public saveFile(file: LocalFileNode, path: string): void {
    const id = generateId(IdType.Save);
    const state: FileSaveState = {
      id,
      file,
      status: SaveStatus.Active,
      startedAt: new Date().toISOString(),
      completedAt: null,
      path,
      progress: 0,
    };

    this.saves.push(state);
    this.processSaveAsync(state);

    eventBus.publish({
      type: 'file.save.updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileSave: state,
    });
  }

  public getSaves(): FileSaveState[] {
    const clonedSaves = cloneDeep(this.saves);
    return clonedSaves.sort((a, b) => {
      // latest first
      return -a.id.localeCompare(b.id);
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
    const node = await this.workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', state.id)
      .executeTakeFirst();

    if (!node) {
      return;
    }

    if (node.server_revision === '0') {
      // file is not synced with the server, we need to wait for the sync to complete
      return;
    }

    const file = mapNode(node) as LocalFileNode;
    const filePath = this.buildFilePath(file.id, file.attributes.extension);
    const exists = await this.app.fs.exists(filePath);
    if (!exists) {
      debug(`File ${file.id} not found on disk`);

      await this.workspace.database
        .deleteFrom('file_states')
        .returningAll()
        .where('id', '=', state.id)
        .executeTakeFirst();

      return;
    }

    const url = await this.app.fs.url(filePath);
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
          fileState: mapFileState(updatedFileState, url),
        });
      }

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
          fileState: mapFileState(updatedFileState, url),
        });
      }

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
          fileState: mapFileState(finalFileState, url),
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
          fileState: mapFileState(updatedFileState, url),
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
          fileState: mapFileState(updatedFileState, null),
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
      const url = await this.app.fs.url(filePath);

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
          fileState: mapFileState(updatedFileState, url),
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
              fileState: mapFileState(updatedFileState, null),
            });
          },
        }
      );

      const writeStream = await this.app.fs.writeStream(filePath);
      await response.body?.pipeTo(writeStream);
      const url = await this.app.fs.url(filePath);

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
          fileState: mapFileState(updatedFileState, url),
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
          fileState: mapFileState(updatedFileState, null),
        });
      }
    }
  }

  private buildFilePath(id: string, extension: string): string {
    return this.app.path.join(this.filesDir, `${id}${extension}`);
  }

  private async processSaveAsync(save: FileSaveState): Promise<void> {
    if (this.app.meta.type !== 'desktop') {
      return;
    }

    try {
      const fileState = await this.workspace.database
        .selectFrom('file_states')
        .selectAll()
        .where('id', '=', save.file.id)
        .executeTakeFirst();

      // if file is already downloaded, copy it to the save path
      if (fileState && fileState.download_progress === 100) {
        const sourceFilePath = this.buildFilePath(
          save.file.id,
          save.file.attributes.extension
        );

        await this.app.fs.copy(sourceFilePath, save.path);
        save.status = SaveStatus.Completed;
        save.completedAt = new Date().toISOString();
        save.progress = 100;

        eventBus.publish({
          type: 'file.save.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileSave: save,
        });

        return;
      }

      // if file is not downloaded, download it
      try {
        const response = await this.workspace.account.client.get(
          `v1/workspaces/${this.workspace.id}/files/${save.file.id}`,
          {
            onDownloadProgress: async (progress, _chunk) => {
              const percent = Math.round((progress.percent || 0) * 100);
              save.progress = percent;

              eventBus.publish({
                type: 'file.save.updated',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                fileSave: save,
              });
            },
          }
        );

        const writeStream = await this.app.fs.writeStream(save.path);
        await response.body?.pipeTo(writeStream);

        save.status = SaveStatus.Completed;
        save.completedAt = new Date().toISOString();
        save.progress = 100;

        eventBus.publish({
          type: 'file.save.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileSave: save,
        });
      } catch {
        save.status = SaveStatus.Failed;
        save.completedAt = new Date().toISOString();
        save.progress = 0;

        eventBus.publish({
          type: 'file.save.updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileSave: save,
        });
      }
    } catch (error) {
      debug(`Error saving file ${save.file.id}: ${error}`);
      save.status = SaveStatus.Failed;
      save.completedAt = new Date().toISOString();
      save.progress = 0;

      eventBus.publish({
        type: 'file.save.updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        fileSave: save,
      });
    }
  }

  private async cleanupFiles(): Promise<void> {
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

  private async cleanOldDownloadedFiles(): Promise<void> {
    debug(`Cleaning old downloaded files for workspace ${this.workspace.id}`);

    const sevenDaysAgo = new Date(Date.now() - ms('7 days')).toISOString();
    let lastId = '';
    const batchSize = 100;

    let hasMoreFiles = true;
    while (hasMoreFiles) {
      let query = this.workspace.database
        .selectFrom('file_states')
        .select(['id', 'upload_status', 'download_completed_at'])
        .where('download_status', '=', DownloadStatus.Completed)
        .where('download_progress', '=', 100)
        .where('download_completed_at', '<', sevenDaysAgo)
        .orderBy('id', 'asc')
        .limit(batchSize);

      if (lastId) {
        query = query.where('id', '>', lastId);
      }

      const fileStates = await query.execute();

      if (fileStates.length === 0) {
        hasMoreFiles = false;
        continue;
      }

      const fileIds = fileStates.map((f) => f.id);

      const fileInteractions = await this.workspace.database
        .selectFrom('node_interactions')
        .select(['node_id', 'last_opened_at'])
        .where('node_id', 'in', fileIds)
        .where('collaborator_id', '=', this.workspace.userId)
        .execute();

      const nodes = await this.workspace.database
        .selectFrom('nodes')
        .select(['id', 'attributes'])
        .where('id', 'in', fileIds)
        .execute();

      const interactionMap = new Map(
        fileInteractions.map((fi) => [fi.node_id, fi.last_opened_at])
      );
      const nodeMap = new Map(nodes.map((n) => [n.id, n.attributes]));

      for (const fileState of fileStates) {
        try {
          const lastOpenedAt = interactionMap.get(fileState.id);
          const shouldDelete = !lastOpenedAt || lastOpenedAt < sevenDaysAgo;

          if (!shouldDelete) {
            continue;
          }

          const nodeAttributes = nodeMap.get(fileState.id);
          if (!nodeAttributes) {
            continue;
          }

          const attributes = JSON.parse(nodeAttributes);
          if (attributes.type !== 'file' || !attributes.extension) {
            continue;
          }

          const filePath = this.buildFilePath(
            fileState.id,
            attributes.extension
          );

          const exists = await this.app.fs.exists(filePath);
          if (!exists) {
            continue;
          }

          debug(`Deleting old downloaded file: ${fileState.id}`);
          await this.app.fs.delete(filePath);

          if (
            fileState.upload_status !== null &&
            fileState.upload_status !== UploadStatus.None
          ) {
            const updatedFileState = await this.workspace.database
              .updateTable('file_states')
              .returningAll()
              .set({
                download_status: DownloadStatus.None,
                download_progress: 0,
                download_completed_at: null,
              })
              .where('id', '=', fileState.id)
              .executeTakeFirst();

            if (updatedFileState) {
              eventBus.publish({
                type: 'file.state.updated',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                fileState: mapFileState(updatedFileState, null),
              });
            }
          } else {
            const deleted = await this.workspace.database
              .deleteFrom('file_states')
              .returningAll()
              .where('id', '=', fileState.id)
              .executeTakeFirst();

            if (deleted) {
              eventBus.publish({
                type: 'file.state.deleted',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                fileId: fileState.id,
              });
            }
          }
        } catch {
          continue;
        }
      }

      lastId = fileStates[fileStates.length - 1]!.id;
      if (fileStates.length < batchSize) {
        hasMoreFiles = false;
      }
    }
  }
}
