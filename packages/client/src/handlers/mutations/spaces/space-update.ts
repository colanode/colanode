import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  SpaceUpdateMutationInput,
  SpaceUpdateMutationOutput,
} from '@colanode/client/mutations/spaces/space-update';
import { SpaceAttributes } from '@colanode/core';

export class SpaceUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<SpaceUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.name = input.name;
        attributes.description = input.description;
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
