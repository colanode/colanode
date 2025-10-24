import { merge } from 'lodash-es';

import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  NodeUpdateMutationInput,
  NodeUpdateMutationOutput,
} from '@colanode/client/mutations/nodes/node-update';

export class NodeUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeUpdateMutationInput>
{
  async handleMutation(
    input: NodeUpdateMutationInput
  ): Promise<NodeUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.userId);
    await workspace.nodes.updateNode(input.nodeId, (attributes) => {
      return merge(attributes, input.attributes);
    });

    return {
      success: true,
    };
  }
}
