import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  SpaceNameUpdateMutationInput,
  SpaceNameUpdateMutationOutput,
} from '@colanode/client/mutations/spaces/space-name-update';
import { SpaceAttributes } from '@colanode/core';

export class SpaceNameUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceNameUpdateMutationInput>
{
  async handleMutation(
    input: SpaceNameUpdateMutationInput
  ): Promise<SpaceNameUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.name = input.name;
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
