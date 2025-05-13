import { WorkspaceUpdateInput } from '@colanode/core';

import { AppService } from '../../../services/app-service';
import { MutationHandler } from '../../../lib/types';
import { mapWorkspace } from '../../../lib/mappers';
import { parseApiError } from '../../../lib/axios';
import { eventBus } from '../../../lib/event-bus';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  WorkspaceUpdateMutationInput,
  WorkspaceUpdateMutationOutput,
} from '../../../mutations/workspaces/workspace-update';
import { Workspace } from '../../../types/workspaces';

export class WorkspaceUpdateMutationHandler
  implements MutationHandler<WorkspaceUpdateMutationInput>
{
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: WorkspaceUpdateMutationInput
  ): Promise<WorkspaceUpdateMutationOutput> {
    const accountService = this.app.getAccount(input.accountId);

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
