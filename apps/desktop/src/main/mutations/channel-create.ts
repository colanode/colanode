import { databaseService } from '@/main/data/database-service';
import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/shared/lib/nodes';
import { MutationHandler } from '@/main/types';
import {
  ChannelCreateMutationInput,
  ChannelCreateMutationOutput,
} from '@/shared/mutations/channel-create';
import { ChannelAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

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
      throw new Error('Space not found');
    }

    const maxIndexResult = await workspaceDatabase
      .selectFrom('nodes')
      .select(['index'])
      .where('parent_id', '=', input.spaceId)
      .orderBy('index', 'desc')
      .limit(1)
      .executeTakeFirst();

    const maxIndex = maxIndexResult?.index ?? null;
    const id = generateId(IdType.Channel);

    const attributes: ChannelAttributes = {
      type: 'channel',
      name: input.name,
      avatar: input.avatar,
      parentId: input.spaceId,
      index: generateNodeIndex(maxIndex, null),
      collaborators: null,
    };

    await nodeService.createNode(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}
