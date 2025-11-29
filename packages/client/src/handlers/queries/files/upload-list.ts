import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapUpload } from '@colanode/client/lib';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { UploadListQueryInput } from '@colanode/client/queries/files/upload-list';
import { Event } from '@colanode/client/types/events';
import { Upload } from '@colanode/client/types/files';

export class UploadListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UploadListQueryInput>
{
  public async handleQuery(input: UploadListQueryInput): Promise<Upload[]> {
    return await this.fetchUploads(input);
  }

  public async checkForChanges(
    event: Event,
    input: UploadListQueryInput,
    output: Upload[]
  ): Promise<ChangeCheckResult<UploadListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'upload.created' &&
      event.workspace.userId === input.userId
    ) {
      const newResult = [...output, event.upload];
      return {
        hasChanges: true,
        result: newResult,
      };
    }

    if (
      event.type === 'upload.updated' &&
      event.workspace.userId === input.userId
    ) {
      const upload = output.find(
        (upload) => upload.fileId === event.upload.fileId
      );

      if (upload) {
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
      }
    }

    if (
      event.type === 'upload.deleted' &&
      event.workspace.userId === input.userId
    ) {
      const upload = output.find(
        (upload) => upload.fileId === event.upload.fileId
      );

      if (upload) {
        const newResult = output.filter(
          (upload) => upload.fileId !== event.upload.fileId
        );

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchUploads(input: UploadListQueryInput): Promise<Upload[]> {
    const workspace = this.getWorkspace(input.userId);

    const uploads = await workspace.database
      .selectFrom('uploads')
      .selectAll()
      .execute();

    return uploads.map(mapUpload);
  }
}
