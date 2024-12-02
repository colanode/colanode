import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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
    const result = await nodeService.updateNode(
      input.messageId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'message') {
          throw new MutationError(
            'invalid_attributes',
            'Node is not a message'
          );
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

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to react to this message."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while deleting the reaction.'
      );
    }

    return {
      success: true,
    };
  }
}
