import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  ChannelUpdateMutationInput,
  ChannelUpdateMutationOutput,
} from '@colanode/client/mutations/channels/channel-update';
import { ChannelAttributes } from '@colanode/core';

export class ChannelUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ChannelUpdateMutationInput>
{
  async handleMutation(
    input: ChannelUpdateMutationInput
  ): Promise<ChannelUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<ChannelAttributes>(
      input.channelId,
      (attributes: ChannelAttributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'not_found') {
      throw new MutationError(
        MutationErrorCode.ChannelNotFound,
        'Channel not found or has been deleted.'
      );
    }

    if (result === 'invalid_attributes') {
      throw new MutationError(
        MutationErrorCode.ChannelUpdateFailed,
        'Something went wrong while updating the channel.'
      );
    }

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ChannelUpdateForbidden,
        "You don't have permission to update this channel."
      );
    }

    if (result === 'success') {
      return {
        success: true,
      };
    }

    throw new MutationError(
      MutationErrorCode.Unknown,
      'Something went wrong while updating the channel.'
    );
  }
}
