import { MutationHandler } from '../../../lib/types';
import {
  NodeReactionDeleteMutationInput,
  NodeReactionDeleteMutationOutput,
} from '../../../mutations/nodes/node-reaction-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class NodeReactionDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput
  ): Promise<NodeReactionDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodeReactions.deleteNodeReaction(
      input.nodeId,
      input.reaction
    );

    return {
      success: true,
    };
  }
}
