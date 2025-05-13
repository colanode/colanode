import { UsersInviteInput, UsersInviteOutput } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import {
  UsersInviteMutationInput,
  UsersInviteMutationOutput,
} from '../../../mutations/workspaces/workspace-users-invite';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { parseApiError } from '../../../lib/axios';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
