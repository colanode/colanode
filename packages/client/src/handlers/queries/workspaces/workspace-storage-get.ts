import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { parseApiError } from '@colanode/client/lib/ky';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import { WorkspaceStorageGetQueryInput } from '@colanode/client/queries/workspaces/workspace-storage-get';
import { Event } from '@colanode/client/types/events';
import { WorkspaceStorageGetOutput } from '@colanode/core';

export class WorkspaceStorageGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<WorkspaceStorageGetQueryInput>
{
  async handleQuery(
    input: WorkspaceStorageGetQueryInput
  ): Promise<WorkspaceStorageGetOutput> {
    const workspace = this.getWorkspace(input.userId);

    try {
      const output = await workspace.account.client
        .get(`v1/workspaces/${workspace.workspaceId}/storage`)
        .json<WorkspaceStorageGetOutput>();

      return output;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new QueryError(QueryErrorCode.ApiError, apiError.message);
    }
  }

  async checkForChanges(
    _event: Event,
    _input: WorkspaceStorageGetQueryInput,
    _output: WorkspaceStorageGetOutput
  ): Promise<ChangeCheckResult<WorkspaceStorageGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
