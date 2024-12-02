import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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
    const result = await nodeService.updateNode(
      input.channelId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'channel') {
          throw new MutationError(
            'invalid_attributes',
            'Something went wrong while updating the channel.'
          );
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'not_found') {
      throw new MutationError(
        'channel_not_found',
        'Channel not found or has been deleted.'
      );
    }

    if (result === 'invalid_attributes') {
      throw new MutationError(
        'invalid_attributes',
        'Something went wrong while updating the channel.'
      );
    }

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this channel."
      );
    }

    if (result === 'success') {
      return {
        success: true,
      };
    }

    throw new MutationError(
      'unknown',
      'Something went wrong while updating the channel.'
    );
  }
}
