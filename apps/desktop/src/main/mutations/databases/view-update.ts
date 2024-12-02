import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ViewUpdateMutationInput,
  ViewUpdateMutationOutput,
} from '@/shared/mutations/databases/view-update';

export class ViewUpdateMutationHandler
  implements MutationHandler<ViewUpdateMutationInput>
{
  async handleMutation(
    input: ViewUpdateMutationInput
  ): Promise<ViewUpdateMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        attributes.views[input.view.id] = input.view;
        return attributes;
      }
    );

    return {
      id: input.view.id,
    };
  }
}
