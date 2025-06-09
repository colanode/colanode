import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapFileState, mapNode } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@colanode/client/mutations';
import { DownloadStatus, LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';

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
      type: 'file.state.updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      fileState: mapFileState(updatedFileState),
    });

    return {
      success: true,
    };
  }
}
