import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '@/shared/mutations/databases/view-delete';

export class ViewDeleteMutationHandler
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<ViewDeleteMutationOutput> {
    const result = await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new MutationError(
            'invalid_attributes',
            'Node is not a database'
          );
        }

        if (!attributes.views[input.viewId]) {
          throw new MutationError(
            'view_not_found',
            'The view you are trying to delete does not exist.'
          );
        }

        delete attributes.views[input.viewId];
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to delete this view."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while deleting the view.'
      );
    }

    return {
      id: input.viewId,
    };
  }
}
