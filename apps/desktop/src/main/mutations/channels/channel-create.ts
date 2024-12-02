import { ChannelAttributes, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ChannelCreateMutationInput,
  ChannelCreateMutationOutput,
} from '@/shared/mutations/channels/channel-create';
import { MutationError } from '@/shared/mutations';

export class ChannelCreateMutationHandler
  implements MutationHandler<ChannelCreateMutationInput>
{
  async handleMutation(
    input: ChannelCreateMutationInput
  ): Promise<ChannelCreateMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const space = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.spaceId)
      .executeTakeFirst();

    if (!space) {
      throw new MutationError(
        'space_not_found',
        'Space not found or has been deleted.'
      );
    }

    const id = generateId(IdType.Channel);
    const attributes: ChannelAttributes = {
      type: 'channel',
      name: input.name,
      avatar: input.avatar,
      parentId: input.spaceId,
      collaborators: null,
    };

    await nodeService.createNode(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}
