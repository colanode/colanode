import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError } from '@/shared/mutations';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@/shared/mutations/files/file-download';

export class FileDownloadMutationHandler
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!node) {
      throw new MutationError(
        'node_not_found',
        'The file you are trying to download does not exist.'
      );
    }

    const file = mapNode(node);
    if (file.attributes.type !== 'file') {
      throw new MutationError(
        'invalid_attributes',
        'The node you are trying to download is not a file.'
      );
    }

    const download = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('node_id', '=', input.fileId)
      .executeTakeFirst();

    if (download) {
      return {
        success: true,
      };
    }

    const createdAt = new Date();
    await workspaceDatabase
      .insertInto('downloads')
      .values({
        node_id: input.fileId,
        upload_id: file.attributes.uploadId,
        created_at: createdAt.toISOString(),
        progress: 0,
        retry_count: 0,
      })
      .execute();

    eventBus.publish({
      type: 'download_created',
      userId: input.userId,
      download: {
        nodeId: node.id,
        uploadId: file.attributes.uploadId,
        createdAt: createdAt.toISOString(),
        updatedAt: null,
        progress: 0,
        retryCount: 0,
      },
    });

    return {
      success: true,
    };
  }
}