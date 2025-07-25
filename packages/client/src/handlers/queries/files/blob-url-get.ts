import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { BlobUrlGetQueryInput } from '@colanode/client/queries';

export class BlobUrlGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<BlobUrlGetQueryInput>
{
  public async handleQuery(
    input: BlobUrlGetQueryInput
  ): Promise<string | null> {
    const exists = await this.app.fs.exists(input.path);
    if (!exists) {
      return null;
    }

    const url = await this.app.fs.url(input.path);
    return url;
  }

  public async checkForChanges(): Promise<
    ChangeCheckResult<BlobUrlGetQueryInput>
  > {
    return {
      hasChanges: false,
    };
  }
}
