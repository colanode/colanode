import { generateId, IdType, NodeRoles } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import {
  SpaceCreateMutationInput,
  SpaceCreateMutationOutput,
} from '@/shared/mutations/space-create';
import {
  ChannelAttributes,
  PageAttributes,
  SpaceAttributes,
} from '@colanode/core';
import { nodeService } from '@/main/services/node-service';
import { databaseService } from '@/main/data/database-service';

export class SpaceCreateMutationHandler
  implements MutationHandler<SpaceCreateMutationInput>
{
  async handleMutation(
    input: SpaceCreateMutationInput
  ): Promise<SpaceCreateMutationOutput> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .where('user_id', '=', input.userId)
      .selectAll()
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    if (workspace.role === 'guest' || workspace.role === 'none') {
      throw new Error('You are not allowed to create spaces in this workspace');
    }

    const spaceId = generateId(IdType.Space);
    const spaceAttributes: SpaceAttributes = {
      type: 'space',
      name: input.name,
      collaborators: {
        [input.userId]: NodeRoles.Admin,
      },
      parentId: input.workspaceId,
      description: input.description,
      avatar: null,
    };

    const pageId = generateId(IdType.Page);
    const pageAttributes: PageAttributes = {
      type: 'page',
      name: 'Home',
      parentId: spaceId,
      content: {},
      collaborators: {},
    };

    const channelId = generateId(IdType.Channel);
    const channelAttributes: ChannelAttributes = {
      type: 'channel',
      name: 'Discussions',
      parentId: spaceId,
    };

    await nodeService.createNode(input.userId, [
      {
        id: spaceId,
        attributes: spaceAttributes,
      },
      {
        id: pageId,
        attributes: pageAttributes,
      },
      {
        id: channelId,
        attributes: channelAttributes,
      },
    ]);

    return {
      id: spaceId,
    };
  }
}
