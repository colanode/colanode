import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { parseApiError } from '@colanode/client/lib/ky';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import {
  WorkspaceStorageUsersGetQueryInput,
  WorkspaceStorageUsersGetQueryOutput,
} from '@colanode/client/queries/workspaces/workspace-storage-users-get';
import { Event } from '@colanode/client/types/events';
import { WorkspaceStorageUsersGetOutput } from '@colanode/core';

const DEFAULT_LIMIT = 100;

export class WorkspaceStorageUsersGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<WorkspaceStorageUsersGetQueryInput>
{
  async handleQuery(
    input: WorkspaceStorageUsersGetQueryInput
  ): Promise<WorkspaceStorageUsersGetQueryOutput> {
    const workspace = this.getWorkspace(input.userId);
    const limit = input.limit ?? DEFAULT_LIMIT;

    try {
      const searchParams = new URLSearchParams({
        limit: Math.max(1, Math.min(100, limit)).toString(),
      });

      if (input.cursor) {
        searchParams.set('after', input.cursor);
      }

      const response = await workspace.account.client
        .get(`v1/workspaces/${workspace.workspaceId}/users/storage`, {
          searchParams,
        })
        .json<WorkspaceStorageUsersGetOutput>();

      return response;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new QueryError(QueryErrorCode.ApiError, apiError.message);
    }
  }

  async checkForChanges(
    _event: Event,
    _input: WorkspaceStorageUsersGetQueryInput,
    _output: WorkspaceStorageUsersGetQueryOutput
  ): Promise<ChangeCheckResult<WorkspaceStorageUsersGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
