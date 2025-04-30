import { WorkspaceUpdateInput } from '@colanode/core';

import { appService } from '@/main/services/app-service';
import { MutationHandler } from '@/main/lib/types';
import { mapWorkspace } from '@/main/lib/mappers';
import { parseApiError } from '@/shared/lib/axios';
import { eventBus } from '@/shared/lib/event-bus';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  WorkspaceUpdateMutationInput,
  WorkspaceUpdateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-update';
import { Workspace } from '@/shared/types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  async handleMutation(
    input: WorkspaceUpdateMutationInput
  ): Promise<WorkspaceUpdateMutationOutput> {
    const accountService = appService.getAccount(input.accountId);

    if (!accountService) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
      );
    }

    const workspaceService = accountService.getWorkspace(input.id);
    if (!workspaceService) {
      throw new MutationError(
        MutationErrorCode.WorkspaceNotFound,
        'Workspace not found.'
      );
    }

    try {
      const body: WorkspaceUpdateInput = {
        name: input.name,
        description: input.description,
        avatar: input.avatar,
      };

      const { data } = await accountService.client.put<Workspace>(
        `/v1/workspaces/${input.id}`,
        body
      );

      const updatedWorkspace = await accountService.database
        .updateTable('workspaces')
        .returningAll()
        .set({
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.role,
        })
        .where((eb) => eb.and([eb('id', '=', input.id)]))
        .executeTakeFirst();

      if (!updatedWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotUpdated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      const workspace = mapWorkspace(updatedWorkspace);
      workspaceService.updateWorkspace(workspace);

      eventBus.publish({
        type: 'workspace_updated',
        workspace: workspace,
      });

      return {
        success: true,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
