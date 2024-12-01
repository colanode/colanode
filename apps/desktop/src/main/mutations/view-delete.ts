import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '@/shared/mutations/view-delete';

export class ViewDeleteMutationHandler
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<ViewDeleteMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        delete attributes.views[input.viewId];
        return attributes;
      }
    );

    return {
      id: input.viewId,
    };
  }
}
