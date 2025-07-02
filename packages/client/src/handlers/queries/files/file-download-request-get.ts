import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import {
  FileDownloadRequestGetQueryInput,
  FileDownloadRequestGetQueryOutput,
} from '@colanode/client/queries/files/file-download-request-get';
import { ApiHeader, build } from '@colanode/core';

export class FileDownloadRequestGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<FileDownloadRequestGetQueryInput>
{
  public async handleQuery(
    input: FileDownloadRequestGetQueryInput
  ): Promise<FileDownloadRequestGetQueryOutput | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const baseUrl = workspace.account.server.httpBaseUrl;

    const url = `${baseUrl}/v1/workspaces/${workspace.id}/files/${input.id}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${workspace.account.token}`,
      [ApiHeader.ClientType]: this.app.meta.type,
      [ApiHeader.ClientPlatform]: this.app.meta.platform,
      [ApiHeader.ClientVersion]: build.version,
    };

    return {
      url,
      headers,
    };
  }

  public async checkForChanges(): Promise<
    ChangeCheckResult<FileDownloadRequestGetQueryInput>
  > {
    return {
      hasChanges: false,
    };
  }
}
