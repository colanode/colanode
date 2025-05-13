import { MutationHandler } from '../../../lib/types';
import {
  NodeReactionCreateMutationInput,
  NodeReactionCreateMutationOutput,
} from '../../../mutations/nodes/node-reaction-create';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class NodeReactionCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput
  ): Promise<NodeReactionCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodeReactions.createNodeReaction(
      input.nodeId,
      input.reaction
    );

    return {
      success: true,
    };
  }
}
