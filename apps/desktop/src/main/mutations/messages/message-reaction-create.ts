import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  MessageReactionCreateMutationInput,
  MessageReactionCreateMutationOutput,
} from '@/shared/mutations/messages/message-reaction-create';

export class MessageReactionCreateMutationHandler
  implements MutationHandler<MessageReactionCreateMutationInput>
{
  async handleMutation(
    input: MessageReactionCreateMutationInput
  ): Promise<MessageReactionCreateMutationOutput> {
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

        const reactionsUsers = attributes.reactions[input.reaction] ?? [];
        if (reactionsUsers.includes(input.userId)) {
          return attributes;
        }

        reactionsUsers.push(input.userId);
        attributes.reactions[input.reaction] = reactionsUsers;
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
        'Something went wrong while reacting to the message.'
      );
    }

    return {
      success: true,
    };
  }
}
