import { MutationHandler } from '../../../lib/types';
import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationOutput,
} from '../../../mutations/spaces/space-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class SpaceDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceDeleteMutationInput>
{
  async handleMutation(
    input: SpaceDeleteMutationInput
  ): Promise<SpaceDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.spaceId);

    return {
      success: true,
    };
  }
}
