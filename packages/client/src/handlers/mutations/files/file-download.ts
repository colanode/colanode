import AsyncLock from 'async-lock';

import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapDownload, mapNode } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@colanode/client/mutations';
import {
  DownloadStatus,
  DownloadType,
  LocalFileNode,
} from '@colanode/client/types';
import { FileStatus, generateId, IdType } from '@colanode/core';

export class FileDownloadMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDownloadMutationInput>
{
  private readonly lock: AsyncLock = new AsyncLock();

  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const node = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.fileId)
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

    const type = input.path ? DownloadType.Manual : DownloadType.Auto;

    if (type === DownloadType.Auto) {
      if (this.app.meta.type === 'web') {
        throw new MutationError(
          MutationErrorCode.DownloadFailed,
          'Auto downloads are not supported on the web.'
        );
      }

      const lockKey = `${workspace.accountId}.${workspace.id}.${input.fileId}.${file.attributes.version}.${type}`;
      const result = await this.lock.acquire(lockKey, async () => {
        const existingDownload = await workspace.database
          .selectFrom('downloads')
          .selectAll()
          .where('file_id', '=', input.fileId)
          .where('version', '=', file.attributes.version)
          .where('type', '=', type)
          .executeTakeFirst();

        if (existingDownload) {
          return {
            success: true,
          };
        }

        return null;
      });

      if (result) {
        return result;
      }
    }

    const path =
      input.path ??
      this.app.path.workspaceFile(
        workspace.accountId,
        workspace.id,
        file.id,
        file.attributes.extension
      );

    const download = await workspace.database
      .insertInto('downloads')
      .returningAll()
      .values({
        id: generateId(IdType.Download),
        file_id: input.fileId,
        version: file.attributes.version,
        type,
        path,
        size: file.attributes.size,
        mime_type: file.attributes.mimeType,
        status: DownloadStatus.Pending,
        progress: 0,
        retries: 0,
        created_at: new Date().toISOString(),
      })
      .executeTakeFirst();

    if (!download) {
      throw new MutationError(
        MutationErrorCode.DownloadFailed,
        'Failed to start the download.'
      );
    }

    this.app.jobs.addJob({
      type: 'file.download',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      downloadId: download.id,
    });

    eventBus.publish({
      type: 'download.created',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      download: mapDownload(download),
    });

    return {
      success: true,
    };
  }
}
