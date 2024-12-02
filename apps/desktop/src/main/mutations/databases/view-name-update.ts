import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ViewNameUpdateMutationInput,
  ViewNameUpdateMutationOutput,
} from '@/shared/mutations/databases/view-name-update';

export class ViewNameUpdateMutationHandler
  implements MutationHandler<ViewNameUpdateMutationInput>
{
  async handleMutation(
    input: ViewNameUpdateMutationInput
  ): Promise<ViewNameUpdateMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Invalid node type');
        }

        const view = attributes.views[input.viewId];
        if (!view) {
          throw new Error('View not found');
        }

        view.name = input.name;
        return attributes;
      }
    );

    return {
      id: input.viewId,
    };
  }
}
