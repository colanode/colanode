import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@/shared/mutations/messages/message-delete';

export class MessageDeleteMutationHandler
  implements MutationHandler<MessageDeleteMutationInput>
{
  async handleMutation(
    input: MessageDeleteMutationInput
  ): Promise<MessageDeleteMutationOutput> {
    await nodeService.deleteNode(input.messageId, input.userId);

    return {
      success: true,
    };
  }
}
