import { UserRoleUpdateInput } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  UserRoleUpdateMutationInput,
  UserRoleUpdateMutationOutput,
} from '@/shared/mutations/workspaces/workspace-user-role-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { parseApiError } from '@/shared/lib/axios';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

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

      await workspace.account.client.put(
        `/v1/workspaces/${workspace.id}/users/${input.userId}`,
        body
      );

      return {
        success: true,
      };
    } catch (error) {
      const apiError = parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
