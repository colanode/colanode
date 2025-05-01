import { WorkspaceOutput } from '@colanode/core';

import { appService } from '@/main/services/app-service';
import { MutationHandler } from '@/main/lib/types';
import { parseApiError } from '@/shared/lib/axios';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  WorkspaceDeleteMutationInput,
  WorkspaceDeleteMutationOutput,
} from '@/shared/mutations/workspaces/workspace-delete';

export class WorkspaceDeleteMutationHandler
  implements MutationHandler<WorkspaceDeleteMutationInput>
{
  async handleMutation(
    input: WorkspaceDeleteMutationInput
  ): Promise<WorkspaceDeleteMutationOutput> {
    const accountService = appService.getAccount(input.accountId);

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
