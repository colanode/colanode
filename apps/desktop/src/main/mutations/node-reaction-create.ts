import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeReactionCreateMutationInput,
  NodeReactionCreateMutationOutput,
} from '@/shared/mutations/node-reaction-create';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput
  ): Promise<NodeReactionCreateMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      if (attributes.type !== 'message') {
        throw new Error('Node is not a message');
      }

      const reactionsUsers = attributes.reactions[input.reaction] ?? [];
      if (reactionsUsers.includes(input.userId)) {
        return attributes;
      }

      reactionsUsers.push(input.userId);
      attributes.reactions[input.reaction] = reactionsUsers;
      return attributes;
    });

    return {
      success: true,
    };
  }
}
