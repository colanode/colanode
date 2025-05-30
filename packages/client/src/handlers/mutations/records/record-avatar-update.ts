import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  RecordAvatarUpdateMutationInput,
  RecordAvatarUpdateMutationOutput,
} from '@colanode/client/mutations/records/record-avatar-update';
import { RecordAttributes } from '@colanode/core';

export class RecordAvatarUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordAvatarUpdateMutationInput>
{
  async handleMutation(
    input: RecordAvatarUpdateMutationInput
  ): Promise<RecordAvatarUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<RecordAttributes>(
      input.recordId,
      (attributes) => {
        attributes.avatar = input.avatar;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to update this record."
      );
    }

    return {
      success: true,
    };
  }
}
