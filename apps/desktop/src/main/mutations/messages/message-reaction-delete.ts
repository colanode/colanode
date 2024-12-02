import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  MessageReactionDeleteMutationInput,
  MessageReactionDeleteMutationOutput,
} from '@/shared/mutations/messages/message-reaction-delete';

export class MessageReactionDeleteMutationHandler
  implements MutationHandler<MessageReactionDeleteMutationInput>
{
  async handleMutation(
    input: MessageReactionDeleteMutationInput
  ): Promise<MessageReactionDeleteMutationOutput> {
    await nodeService.updateNode(
      input.messageId,
      input.userId,
      (attributes) => {
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
      }
    );

    return {
      success: true,
    };
  }
}
