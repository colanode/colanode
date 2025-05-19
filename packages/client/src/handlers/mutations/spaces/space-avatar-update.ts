import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  SpaceAvatarUpdateMutationInput,
  SpaceAvatarUpdateMutationOutput,
} from '@colanode/client/mutations/spaces/space-avatar-update';
import { SpaceAttributes } from '@colanode/core';

export class SpaceAvatarUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceAvatarUpdateMutationInput>
{
  async handleMutation(
    input: SpaceAvatarUpdateMutationInput
  ): Promise<SpaceAvatarUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.avatar = input.avatar;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateForbidden,
        "You don't have permission to update this space."
      );
    }

    return {
      success: true,
    };
  }
}
