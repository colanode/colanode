import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  NodeDeleteMutationInput,
  NodeDeleteMutationOutput,
} from '@colanode/client/mutations/nodes/node-delete';

export class NodeDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput
  ): Promise<NodeDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.userId);
    await workspace.nodes.deleteNode(input.nodeId);

    return {
      success: true,
    };
  }
}
