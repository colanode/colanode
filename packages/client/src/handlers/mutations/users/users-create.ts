import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  UsersCreateMutationInput,
  UsersCreateMutationOutput,
} from '@colanode/client/mutations/users/users-create';
import { UsersCreateInput, UsersCreateOutput } from '@colanode/core';

export class UsersCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<UsersCreateMutationInput>
{
  async handleMutation(
    input: UsersCreateMutationInput
  ): Promise<UsersCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    try {
      const body: UsersCreateInput = {
        users: input.users,
      };

      const output = await workspace.account.client
        .post(`v1/workspaces/${workspace.id}/users`, {
          json: body,
        })
        .json<UsersCreateOutput>();

      for (const user of output.users) {
        await workspace.users.upsert(user);
      }

      return output;
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
