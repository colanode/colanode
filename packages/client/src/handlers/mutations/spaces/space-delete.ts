import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationOutput,
} from '@colanode/client/mutations/spaces/space-delete';

export class SpaceDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceDeleteMutationInput>
{
  async handleMutation(
    input: SpaceDeleteMutationInput
  ): Promise<SpaceDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.userId);
    await workspace.nodes.deleteNode(input.spaceId);

    return {
      success: true,
    };
  }
}
