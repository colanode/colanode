import {
  DatabaseAttributes,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  DatabaseCreateMutationInput,
  DatabaseCreateMutationOutput,
} from '@/shared/mutations/databases/database-create';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput
  ): Promise<DatabaseCreateMutationOutput> {
    const databaseId = generateId(IdType.Database);
    const viewId = generateId(IdType.View);
    const fieldId = generateId(IdType.Field);

    const attributes: DatabaseAttributes = {
      type: 'database',
      name: input.name,
      avatar: input.avatar,
      parentId: input.spaceId,
      fields: {
        [fieldId]: {
          id: fieldId,
          type: 'text',
          index: generateNodeIndex(null, null),
          name: 'Comment',
        },
      },
      views: {
        [viewId]: {
          id: viewId,
          type: 'table',
          name: 'Default',
          fields: {},
          filters: {},
          sorts: {},
          avatar: null,
          index: generateNodeIndex(null, null),
          groupBy: null,
        },
      },
    };

    await nodeService.createNode(input.userId, {
      id: databaseId,
      attributes,
    });

    return {
      id: databaseId,
    };
  }
}
