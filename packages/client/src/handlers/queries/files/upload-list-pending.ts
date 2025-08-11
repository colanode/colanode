import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapUpload } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { UploadListPendingQueryInput } from '@colanode/client/queries/files/upload-list-pending';
import { Event } from '@colanode/client/types/events';
import { Upload, UploadStatus } from '@colanode/client/types/files';

export class UploadListPendingQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UploadListPendingQueryInput>
{
  public async handleQuery(
    input: UploadListPendingQueryInput
  ): Promise<Upload[]> {
    return await this.fetchPendingUploads(input);
  }

  public async checkForChanges(
    event: Event,
    input: UploadListPendingQueryInput,
    output: Upload[]
  ): Promise<ChangeCheckResult<UploadListPendingQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'upload.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.upload.status === UploadStatus.Pending
    ) {
      const newResult = await this.fetchPendingUploads(input);
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'upload.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const upload = output.find(
        (upload) => upload.fileId === event.upload.fileId
      );

      if (!upload) {
        return {
          hasChanges: false,
        };
      }

      if (
        upload.status === UploadStatus.Pending &&
        event.upload.status === UploadStatus.Uploading
      ) {
        const newResult = output.map((upload) => {
          if (upload.fileId === event.upload.fileId) {
            return event.upload;
          }

          return upload;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      } else if (
        upload.status === UploadStatus.Uploading &&
        event.upload.status === UploadStatus.Pending
      ) {
        const newResult = output.map((upload) => {
          if (upload.fileId === event.upload.fileId) {
            return event.upload;
          }

          return upload;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      } else {
        const newResult = await this.fetchPendingUploads(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'upload.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const upload = output.find(
        (upload) => upload.fileId === event.upload.fileId
      );

      if (!upload) {
        return {
          hasChanges: false,
        };
      }

      if (output.length === input.count) {
        const newResult = await this.fetchPendingUploads(input);
        return {
          hasChanges: true,
          result: newResult,
        };
      }

      const newOutput = output.filter(
        (upload) => upload.fileId !== event.upload.fileId
      );
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchPendingUploads(
    input: UploadListPendingQueryInput
  ): Promise<Upload[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const uploads = await workspace.database
      .selectFrom('uploads')
      .selectAll()
      .where('status', 'in', [UploadStatus.Pending, UploadStatus.Uploading])
      .orderBy('file_id', 'desc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return uploads.map(mapUpload);
  }
}
