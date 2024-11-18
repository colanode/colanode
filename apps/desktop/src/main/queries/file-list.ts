import { FileListQueryInput } from '@/shared/queries/file-list';
import { databaseService } from '@/main/data/database-service';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { NodeTypes } from '@colanode/core';
import { compareString } from '@/shared/lib/utils';
import { FileNode } from '@/shared/types/files';
import { Event } from '@/shared/types/events';

interface FileRow {
  id: string;
  attributes: string;
  parent_id: string | null;
  type: string;
  download_progress?: number | null;
  created_at: string;
  created_by: string;
}

export class FileListQueryHandler implements QueryHandler<FileListQueryInput> {
  public async handleQuery(input: FileListQueryInput): Promise<FileNode[]> {
    const files = await this.fetchFiles(input);
    return this.buildFiles(files);
  }

  public async checkForChanges(
    event: Event,
    input: FileListQueryInput,
    output: FileNode[]
  ): Promise<ChangeCheckResult<FileListQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'node_created' &&
      event.userId === input.userId &&
      event.node.type === 'file' &&
      event.node.parentId === input.parentId
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'node_updated' &&
      event.userId === input.userId &&
      event.node.type === 'file' &&
      event.node.parentId === input.parentId
    ) {
      const newOutput = [...output];
      const file = newOutput.find((file) => file.id === event.node.id);
      if (file) {
        file.name = event.node.attributes.name;
        file.mimeType = event.node.attributes.mimeType;
        file.size = event.node.attributes.size;
        file.extension = event.node.attributes.extension;
        file.fileName = event.node.attributes.fileName;

        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    if (
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'file' &&
      event.node.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.node.id);
      if (file) {
        const newOutput = output.filter((file) => file.id !== event.node.id);
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    if (
      (event.type === 'download_created' ||
        event.type === 'download_updated') &&
      event.userId === input.userId
    ) {
      const newOutput = [...output];
      const nodeId = event.download.nodeId;
      const file = newOutput.find((file) => file.id === nodeId);
      if (file) {
        file.downloadProgress = event.download.progress;
        return {
          hasChanges: true,
          result: newOutput,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFiles(input: FileListQueryInput): Promise<FileRow[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const files = await workspaceDatabase
      .selectFrom('nodes')
      .leftJoin('downloads', (join) =>
        join.onRef('nodes.id', '=', 'downloads.node_id')
      )
      .select([
        'nodes.id',
        'nodes.attributes',
        'nodes.parent_id',
        'nodes.type',
        'downloads.progress as download_progress',
        'nodes.created_at',
        'nodes.created_by',
      ])
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.parentId),
          eb('type', '=', NodeTypes.File),
        ])
      )
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return files;
  }

  private buildFiles = (fileRows: FileRow[]): FileNode[] => {
    const files: FileNode[] = [];
    for (const fileRow of fileRows) {
      const attributes = JSON.parse(fileRow.attributes);
      files.push({
        id: fileRow.id,
        name: attributes.name,
        mimeType: attributes.mimeType,
        size: attributes.size,
        extension: attributes.extension,
        fileName: attributes.fileName,
        createdAt: fileRow.created_at,
        downloadProgress: fileRow.download_progress,
      });
    }

    return files.sort((a, b) => compareString(a.id, b.id));
  };
}
