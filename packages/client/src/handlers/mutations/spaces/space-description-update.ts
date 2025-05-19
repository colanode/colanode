import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  SpaceDescriptionUpdateMutationInput,
  SpaceDescriptionUpdateMutationOutput,
} from '@colanode/client/mutations/spaces/space-description-update';
import { SpaceAttributes } from '@colanode/core';

export class SpaceDescriptionUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceDescriptionUpdateMutationInput>
{
  async handleMutation(
    input: SpaceDescriptionUpdateMutationInput
  ): Promise<SpaceDescriptionUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.description = input.description;
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
