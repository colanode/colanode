import { eventBus } from '@colanode/client/lib/event-bus';
import { parseApiError } from '@colanode/client/lib/ky';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  WorkspaceCreateMutationInput,
  WorkspaceCreateMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-create';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceCreateInput, WorkspaceOutput } from '@colanode/core';

export class WorkspaceCreateMutationHandler implements MutationHandler<WorkspaceCreateMutationInput> {
  private readonly app: AppService;

  constructor(app: AppService) {
    this.app = app;
  }

  async handleMutation(
    input: WorkspaceCreateMutationInput
  ): Promise<WorkspaceCreateMutationOutput> {
    const account = this.app.getAccount(input.accountId);

    if (!account) {
      throw new MutationError(
        MutationErrorCode.AccountNotFound,
        'Account not found or has been logged out.'
      );
    }

    try {
      const body: WorkspaceCreateInput = {
        name: input.name,
        description: input.description,
        avatar: input.avatar,
      };

      const response = await account.client
        .post(`v1/workspaces`, {
          json: body,
        })
        .json<WorkspaceOutput>();

      const createdWorkspace = await this.app.database
        .insertInto('workspaces')
        .returningAll()
        .values({
          user_id: response.user.id,
          workspace_id: response.id,
          account_id: response.user.accountId,
          name: response.name,
          description: response.description,
          avatar: response.avatar,
          role: response.user.role,
          max_file_size: response.maxFileSize,
          created_at: new Date().toISOString(),
          status: response.status,
        })
        .onConflict((cb) => cb.doNothing())
        .executeTakeFirst();

      if (!createdWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotCreated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      await this.app.initWorkspace(createdWorkspace);

      const workspace = mapWorkspace(createdWorkspace);
      eventBus.publish({
        type: 'workspace.created',
        workspace: workspace,
      });

      return {
        id: createdWorkspace.workspace_id,
        userId: createdWorkspace.user_id,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
