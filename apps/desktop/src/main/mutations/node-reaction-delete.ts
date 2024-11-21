import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  NodeReactionDeleteMutationInput,
  NodeReactionDeleteMutationOutput,
} from '@/shared/mutations/node-reaction-delete';

export class NodeReactionDeleteMutationHandler
  implements MutationHandler<NodeReactionDeleteMutationInput>
{
  async handleMutation(
    input: NodeReactionDeleteMutationInput
  ): Promise<NodeReactionDeleteMutationOutput> {
    await nodeService.updateNode(input.nodeId, input.userId, (attributes) => {
      if (attributes.type !== 'message') {
        throw new Error('Node is not a message');
      }

      const reactionUsers = attributes.reactions[input.reaction] ?? [];
      if (!reactionUsers.includes(input.userId)) {
        return attributes;
      }

      const index = reactionUsers.indexOf(input.userId);
      if (index === -1) {
        return attributes;
      }

      reactionUsers.splice(index, 1);
      attributes.reactions[input.reaction] = reactionUsers;
      return attributes;
    });

    return {
      success: true,
    };
  }
}
