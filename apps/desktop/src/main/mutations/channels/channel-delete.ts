import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ChannelDeleteMutationInput,
  ChannelDeleteMutationOutput,
} from '@/shared/mutations/channels/channel-delete';

export class ChannelDeleteMutationHandler
  implements MutationHandler<ChannelDeleteMutationInput>
{
  async handleMutation(
    input: ChannelDeleteMutationInput
  ): Promise<ChannelDeleteMutationOutput> {
    await nodeService.deleteNode(input.channelId, input.userId);

    return {
      success: true,
    };
  }
}
