import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  FileUploadItem,
  FileUploadsListQueryInput,
} from '@colanode/client/queries/files/file-uploads-list';
import { Event } from '@colanode/client/types/events';

export class FileUploadsListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileUploadsListQueryInput>
{
  public async handleQuery(
    input: FileUploadsListQueryInput
  ): Promise<FileUploadItem[]> {
    return await this.fetchFileStates(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileUploadsListQueryInput,
    output: FileUploadItem[]
  ): Promise<ChangeCheckResult<FileUploadsListQueryInput>> {
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
      event.type === 'file.state.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const fileState = output.find(
        (fileState) => fileState.id === event.fileState.id
      );

      if (fileState) {
        const uploadStatus = event.fileState.uploadStatus;
        const uploadProgress = event.fileState.uploadProgress;
        const uploadStartedAt = event.fileState.uploadStartedAt;
        const uploadCompletedAt = event.fileState.uploadCompletedAt;

        if (!uploadStatus || !uploadStartedAt) {
          const newResult = await this.fetchFileStates(input);

          return {
            hasChanges: true,
            result: newResult,
          };
        }

        const newResult = output.map((fileState) => {
          if (fileState.id === event.fileState.id) {
            return {
              id: fileState.id,
              status: uploadStatus,
              progress: uploadProgress ?? 0,
              createdAt: uploadStartedAt,
              completedAt: uploadCompletedAt,
            };
          }

          return fileState;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const fileState = output.find(
        (fileState) => fileState.id === event.node.id
      );
      if (fileState) {
        const newResult = output.filter(
          (fileState) => fileState.id !== event.node.id
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

  private async fetchFileStates(
    input: FileUploadsListQueryInput
  ): Promise<FileUploadItem[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const query = workspace.database.selectFrom('file_states').selectAll();

    const fileStates = await query
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .where('upload_status', 'is not', null)
      .execute();

    const result: FileUploadItem[] = [];

    for (const fileState of fileStates) {
      if (fileState.upload_status === null) {
        continue;
      }

      if (!fileState.upload_started_at) {
        continue;
      }

      result.push({
        id: fileState.id,
        status: fileState.upload_status,
        progress: fileState.upload_progress ?? 0,
        createdAt: fileState.upload_started_at,
        completedAt: fileState.upload_completed_at,
      });
    }

    return result;
  }
}
