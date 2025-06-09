import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  FileUrlGetQueryInput,
  FileUrlGetQueryOutput,
} from '@colanode/client/queries/files/file-url-get';
import { AppService } from '@colanode/client/services';
import { Event } from '@colanode/client/types/events';

export class FileUrlGetQueryHandler
  implements QueryHandler<FileUrlGetQueryInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  public async handleQuery(
    input: FileUrlGetQueryInput
  ): Promise<FileUrlGetQueryOutput> {
    return await this.buildFileUrl(input);
  }

  public async checkForChanges(
    event: Event,
    input: FileUrlGetQueryInput,
    _: FileUrlGetQueryOutput
  ): Promise<ChangeCheckResult<FileUrlGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: {
          url: null,
        },
      };
    }

    if (
      event.type === 'file.state.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.fileState.id === input.id
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.id
    ) {
      return {
        hasChanges: true,
        result: {
          url: null,
        },
      };
    }

    if (
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.id
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async buildFileUrl(
    input: FileUrlGetQueryInput
  ): Promise<FileUrlGetQueryOutput> {
    const filePath = this.app.path.workspaceFile(
      input.accountId,
      input.workspaceId,
      input.id,
      input.extension
    );

    const exists = await this.app.fs.exists(filePath);
    if (!exists) {
      return {
        url: null,
      };
    }

    const url = await this.app.fs.url(filePath);
    return {
      url,
    };
  }
}
