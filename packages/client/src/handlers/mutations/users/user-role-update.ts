import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  UserRoleUpdateMutationInput,
  UserRoleUpdateMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-user-role-update';
import { UserRoleUpdateInput, UserRoleUpdateOutput } from '@colanode/core';

export class UserRoleUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<UserRoleUpdateMutationInput>
{
  async handleMutation(
    input: UserRoleUpdateMutationInput
  ): Promise<UserRoleUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    try {
      const body: UserRoleUpdateInput = {
        role: input.role,
      };

      await workspace.account.client
        .put(`v1/workspaces/${workspace.id}/users/${input.userId}`, {
          json: body,
        })
        .json<UserRoleUpdateOutput>();

      return {
        success: true,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
