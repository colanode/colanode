import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ChannelUpdateMutationInput,
  ChannelUpdateMutationOutput,
} from '@/shared/mutations/channels/channel-update';

export class ChannelUpdateMutationHandler
  implements MutationHandler<ChannelUpdateMutationInput>
{
  async handleMutation(
    input: ChannelUpdateMutationInput
  ): Promise<ChannelUpdateMutationOutput> {
    await nodeService.updateNode(
      input.channelId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'channel') {
          throw new Error('Node is not a channel');
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    return {
      success: true,
    };
  }
}
