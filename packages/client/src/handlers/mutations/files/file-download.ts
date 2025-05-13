import { FileStatus } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { mapFileState, mapNode } from '../../../lib/mappers';
import { eventBus } from '../../../lib/event-bus';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '../../../mutations/files/file-download';
import { DownloadStatus } from '../../../types/files';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';
import { LocalFileNode } from '../../../types/nodes';

export class FileDownloadMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDownloadMutationInput>
{
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

    const fileState = await workspace.database
      .selectFrom('file_states')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (
      fileState?.download_status === DownloadStatus.Completed ||
      fileState?.download_status === DownloadStatus.Pending
    ) {
      return {
        success: true,
      };
    }

    const updatedFileState = await workspace.database
      .insertInto('file_states')
      .returningAll()
      .values({
        id: input.fileId,
        version: file.attributes.version,
        download_status: DownloadStatus.Pending,
        download_progress: 0,
        download_retries: 0,
        download_started_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.columns(['id']).doUpdateSet({
          download_status: DownloadStatus.Pending,
          download_progress: 0,
          download_retries: 0,
          download_started_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!updatedFileState) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'The file you are trying to download does not exist.'
      );
    }

    workspace.files.triggerDownloads();

    eventBus.publish({
      type: 'file_state_updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      fileState: mapFileState(updatedFileState),
    });

    return {
      success: true,
    };
  }
}
