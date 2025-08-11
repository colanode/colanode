import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import {
  ChangeCheckResult,
  parseApiError,
  QueryHandler,
} from '@colanode/client/lib';
import { QueryError, QueryErrorCode } from '@colanode/client/queries';
import { WorkspaceStorageGetQueryInput } from '@colanode/client/queries/workspaces/workspace-storage-get';
import { Event } from '@colanode/client/types/events';
import { WorkspaceStorageGetOutput } from '@colanode/core';

const EMPTY_STORAGE_OUTPUT: WorkspaceStorageGetOutput = {
  storageLimit: '0',
  storageUsed: '0',
  subtypes: [],
  users: [],
};

export class WorkspaceStorageGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<WorkspaceStorageGetQueryInput>
{
  public async handleQuery(
    input: WorkspaceStorageGetQueryInput
  ): Promise<WorkspaceStorageGetOutput> {
    return this.fetchWorkspaceStorage(input.accountId, input.workspaceId);
  }

  public async checkForChanges(
    event: Event,
    input: WorkspaceStorageGetQueryInput,
    _: WorkspaceStorageGetOutput
  ): Promise<ChangeCheckResult<WorkspaceStorageGetQueryInput>> {
    if (
      event.type === 'workspace.created' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      const result = await this.fetchWorkspaceStorage(
        input.accountId,
        input.workspaceId
      );

      return {
        hasChanges: true,
        result,
      };
    }

    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: EMPTY_STORAGE_OUTPUT,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchWorkspaceStorage(
    accountId: string,
    workspaceId: string
  ): Promise<WorkspaceStorageGetOutput> {
    const workspace = this.getWorkspace(accountId, workspaceId);
    if (!workspace) {
      return EMPTY_STORAGE_OUTPUT;
    }

    try {
      const response = await workspace.account.client
        .get(`v1/workspaces/${workspace.id}/storage`)
        .json<WorkspaceStorageGetOutput>();

      return response;
    } catch (error) {
      console.error(error);
      const apiError = await parseApiError(error);
      throw new QueryError(QueryErrorCode.ApiError, apiError.message);
    }
  }
}
