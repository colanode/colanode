import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapFile } from '@/main/lib/mappers';
import { FileListQueryInput } from '@/shared/queries/files/file-list';
import { Event } from '@/shared/types/events';
import {
  DownloadStatus,
  FileWithState,
  UploadStatus,
} from '@/shared/types/files';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';

export class FileListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileListQueryInput>
{
  public async handleQuery(
    input: FileListQueryInput
  ): Promise<FileWithState[]> {
    return await this.fetchFiles(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileListQueryInput,
    output: FileWithState[]
  ): Promise<ChangeCheckResult<FileListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'file_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.parentId === input.parentId
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'file_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.file.id);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.file.id) {
            return {
              ...event.file,
              downloadProgress: file.downloadProgress,
              downloadStatus: file.downloadStatus,
              uploadProgress: file.uploadProgress,
              uploadStatus: file.uploadStatus,
            };
          }

          return file;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'file_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.file.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.file.id);
      if (file) {
        const output = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: output,
        };
      }
    }

    if (
      event.type === 'file_state_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const file = output.find((file) => file.id === event.fileState.fileId);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.fileState.fileId) {
            return {
              ...file,
              ...event.fileState,
            };
          }
          return file;
        });

        return {
          hasChanges: true,
          result: newResult,
        };
      }
    }

    if (
      event.type === 'file_state_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId
    ) {
      const file = output.find((file) => file.id === event.fileState.fileId);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.fileState.fileId) {
            return {
              ...file,
              ...event.fileState,
            };
          }
          return file;
        });

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

  private async fetchFiles(
    input: FileListQueryInput
  ): Promise<FileWithState[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const files = await workspace.database
      .selectFrom('files as f')
      .leftJoin('file_states as fs', 'f.id', 'fs.file_id')
      .select([
        'f.id',
        'f.type',
        'f.parent_id',
        'f.root_id',
        'f.entry_id',
        'f.name',
        'f.original_name',
        'f.mime_type',
        'f.extension',
        'f.size',
        'f.created_at',
        'f.created_by',
        'f.updated_at',
        'f.updated_by',
        'f.deleted_at',
        'f.status',
        'f.version',
        'fs.download_status',
        'fs.download_progress',
        'fs.upload_status',
        'fs.upload_progress',
      ])
      .where('f.parent_id', '=', input.parentId)
      .where('f.deleted_at', 'is', null)
      .orderBy('f.id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    const filesWithState: FileWithState[] = files.map((file) => ({
      ...mapFile(file),
      downloadProgress: file.download_progress ?? 0,
      downloadStatus: file.download_status ?? DownloadStatus.None,
      uploadProgress: file.upload_progress ?? 0,
      uploadStatus: file.upload_status ?? UploadStatus.None,
    }));

    return filesWithState;
  }
}
