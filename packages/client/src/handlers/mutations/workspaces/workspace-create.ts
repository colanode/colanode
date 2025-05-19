import { parseApiError } from '@colanode/client/lib/axios';
import { eventBus } from '@colanode/client/lib/event-bus';
import { mapWorkspace } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  WorkspaceCreateMutationInput,
  WorkspaceCreateMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-create';
import { AppService } from '@colanode/client/services/app-service';
import { WorkspaceCreateInput, WorkspaceOutput } from '@colanode/core';

export class WorkspaceCreateMutationHandler
  implements MutationHandler<WorkspaceCreateMutationInput>
{
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

      const { data } = await account.client.post<WorkspaceOutput>(
        `/v1/workspaces`,
        body
      );

      const createdWorkspace = await account.database
        .insertInto('workspaces')
        .returningAll()
        .values({
          id: data.id,
          account_id: data.user.accountId,
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.user.role,
          storage_limit: data.user.storageLimit,
          max_file_size: data.user.maxFileSize,
          user_id: data.user.id,
          created_at: new Date().toISOString(),
        })
        .onConflict((cb) => cb.doNothing())
        .executeTakeFirst();

      if (!createdWorkspace) {
        throw new MutationError(
          MutationErrorCode.WorkspaceNotCreated,
          'Something went wrong updating the workspace. Please try again later.'
        );
      }

      const workspace = mapWorkspace(createdWorkspace);
      await account.initWorkspace(workspace);

      eventBus.publish({
        type: 'workspace_created',
        workspace: workspace,
      });

      return {
        id: createdWorkspace.id,
        userId: createdWorkspace.user_id,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
