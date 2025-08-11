import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { parseApiError } from '@colanode/client/lib/ky';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  UserStorageUpdateMutationInput,
  UserStorageUpdateMutationOutput,
} from '@colanode/client/mutations/users/user-storage-update';
import { UserOutput, UserStorageUpdateInput } from '@colanode/core';

export class UserStorageUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<UserStorageUpdateMutationInput>
{
  async handleMutation(
    input: UserStorageUpdateMutationInput
  ): Promise<UserStorageUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    try {
      const body: UserStorageUpdateInput = {
        storageLimit: input.storageLimit,
        maxFileSize: input.maxFileSize,
      };

      const output = await workspace.account.client
        .patch(`v1/workspaces/${workspace.id}/users/${input.userId}/storage`, {
          json: body,
        })
        .json<UserOutput>();

      await workspace.users.upsert(output);

      return {
        success: true,
      };
    } catch (error) {
      const apiError = await parseApiError(error);
      throw new MutationError(MutationErrorCode.ApiError, apiError.message);
    }
  }
}
