import { generateId, IdType } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import {
  ViewCreateMutationInput,
  ViewCreateMutationOutput,
} from '@/shared/mutations/view-create';
import { compareString } from '@/shared/lib/utils';
import { generateNodeIndex } from '@/shared/lib/nodes';
import { nodeService } from '@/main/services/node-service';

export class ViewCreateMutationHandler
  implements MutationHandler<ViewCreateMutationInput>
{
  async handleMutation(
    input: ViewCreateMutationInput
  ): Promise<ViewCreateMutationOutput> {
    const id = generateId(IdType.View);
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        const maxIndex = Object.values(attributes.views)
          .map((view) => view.index)
          .sort((a, b) => -compareString(a, b))[0];

        attributes.views[id] = {
          id: id,
          type: input.viewType,
          name: input.name,
          avatar: null,
          fields: {},
          filters: {},
          sorts: {},
          groupBy: input.groupBy,
          index: generateNodeIndex(maxIndex, null),
        };

        return attributes;
      }
    );

    return {
      id: id,
    };
  }
}