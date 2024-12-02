import { compareString, FileNode } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { SelectNode } from '@/main/data/workspace/schema';
import { ChangeCheckResult, QueryHandler } from '@/main/types';
import { mapNode } from '@/main/utils';
import { FileListQueryInput } from '@/shared/queries/files/file-list';
import { Event } from '@/shared/types/events';

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
      const file = output.find((file) => file.id === event.node.id);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.node.id) {
            return event.node as FileNode;
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
      event.type === 'node_deleted' &&
      event.userId === input.userId &&
      event.node.type === 'file' &&
      event.node.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.node.id);
      if (file) {
        const newResult = await this.handleQuery(input);
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

  private async fetchFiles(input: FileListQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const offset = (input.page - 1) * input.count;
    const files = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where((eb) =>
        eb.and([eb('parent_id', '=', input.parentId), eb('type', '=', 'file')])
      )
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return files;
  }

  private buildFiles = (rows: SelectNode[]): FileNode[] => {
    const nodes = rows.map(mapNode);
    const files: FileNode[] = [];

    for (const node of nodes) {
      if (node.type !== 'file') {
        continue;
      }

      files.push(node);
    }

    return files.sort((a, b) => compareString(a.id, b.id));
  };
}
