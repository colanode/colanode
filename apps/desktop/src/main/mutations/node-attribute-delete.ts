import { unset } from 'lodash-es';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeAttributeDeleteMutationInput,
  NodeAttributeDeleteMutationOutput,
} from '@/shared/mutations/node-attribute-delete';

export class NodeAttributeDeleteMutationHandler
  implements MutationHandler<NodeAttributeDeleteMutationInput>
{
  async handleMutation(
    input: NodeAttributeDeleteMutationInput
  ): Promise<NodeAttributeDeleteMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      unset(attributes, input.path);
      return attributes;
    });

    return {
      success: true,
    };
  }
}
