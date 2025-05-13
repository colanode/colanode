import { WorkspaceOutput } from '@colanode/core';

import { AppService } from '../../../services/app-service';
import { MutationHandler } from '../../../lib/types';
import { parseApiError } from '../../../lib/axios';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  WorkspaceDeleteMutationInput,
  WorkspaceDeleteMutationOutput,
} from '../../../mutations/workspaces/workspace-delete';

export class WorkspaceDeleteMutationHandler
  implements MutationHandler<WorkspaceDeleteMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: WorkspaceDeleteMutationInput
  ): Promise<WorkspaceDeleteMutationOutput> {
    const accountService = this.app.getAccount(input.accountId);

    if (!accountService) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
      );
    }

    const workspaceService = accountService.getWorkspace(input.workspaceId);
    if (!workspaceService) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace not found.'
      );
    }

    try {
      const { data } = await accountService.client.delete<WorkspaceOutput>(
        `/v1/workspaces/${input.workspaceId}`
      );

      await accountService.deleteWorkspace(data.id);

      return {
        id: data.id,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
