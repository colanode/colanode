import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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
    await nodeService.updateNode(
      input.messageId,
      input.userId,
      (attributes) => {
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
      }
    );

    return {
      success: true,
    };
  }
}
