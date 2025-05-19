import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { parseApiError } from '@colanode/client/lib/axios';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  UsersInviteMutationInput,
  UsersInviteMutationOutput,
} from '@colanode/client/mutations/workspaces/workspace-users-invite';
import { UsersInviteInput, UsersInviteOutput } from '@colanode/core';

export class UsersInviteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<UsersInviteMutationInput>
{
  async handleMutation(
    input: UsersInviteMutationInput
  ): Promise<UsersInviteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    try {
      const body: UsersInviteInput = {
        emails: input.emails,
        role: input.role,
      };

      await workspace.account.client.post<UsersInviteOutput>(
        `/v1/workspaces/${workspace.id}/users`,
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
