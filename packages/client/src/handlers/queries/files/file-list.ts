import { ChangeCheckResult, QueryHandler } from '../../../lib/types';
import { mapNode } from '../../../lib/mappers';
import { FileListQueryInput } from '../../../queries/files/file-list';
import { Event } from '../../../types/events';
import { LocalFileNode } from '../../../types/nodes';
import { WorkspaceQueryHandlerBase } from '../workspace-query-handler-base';

export class FileListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileListQueryInput>
{
  public async handleQuery(
    input: FileListQueryInput
  ): Promise<LocalFileNode[]> {
    return await this.fetchFiles(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileListQueryInput,
    output: LocalFileNode[]
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
      event.type === 'node_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
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
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.node.id);
      if (file) {
        const newResult = output.map((file) => {
          if (file.id === event.node.id && event.node.type === 'file') {
            return event.node;
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
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.parentId === input.parentId
    ) {
      const file = output.find((file) => file.id === event.node.id);
      if (file) {
        const output = await this.handleQuery(input);
        return {
          hasChanges: true,
          result: output,
        };
      }
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchFiles(
    input: FileListQueryInput
  ): Promise<LocalFileNode[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const offset = (input.page - 1) * input.count;
    const files = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('type', '=', 'file')
      .where('parent_id', '=', input.parentId)
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return files.map(mapNode) as LocalFileNode[];
  }
}
