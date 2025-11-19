import { eventBus } from '@colanode/client/lib/event-bus';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  WorkspaceUpdateMutationInput,
  WorkspaceUpdateMutationOutput,
} from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services/app-service';
import { Workspace } from '@colanode/client/types';
import { WorkspaceUpdateInput } from '@colanode/core';

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
    const accountService = this.app.getAccount(input.userId);

    if (!accountService) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
      );
    }

    const workspaceService = this.app.getWorkspace(input.userId);
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

      const response = await accountService.client
        .patch(`v1/workspaces/${input.id}`, {
          json: body,
        })
        .json<Workspace>();

      const updatedWorkspace = await this.app.database
        .updateTable('workspaces')
        .returningAll()
        .set({
          name: response.name,
          description: response.description,
          avatar: response.avatar,
          role: response.role,
        })
        .where((eb) => eb.and([eb('user_id', '=', input.userId)]))
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
        type: 'workspace.updated',
        workspace: workspace,
      });

      return {
        success: true,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
