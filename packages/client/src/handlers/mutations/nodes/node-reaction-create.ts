import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  NodeReactionCreateMutationInput,
  NodeReactionCreateMutationOutput,
} from '@colanode/client/mutations/nodes/node-reaction-create';

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
