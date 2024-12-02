import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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

        if (!attributes.views[input.view.id]) {
          throw new MutationError(
            'view_not_found',
            'The view you are trying to update does not exist.'
          );
        }

        attributes.views[input.view.id] = input.view;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this view."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the view.'
      );
    }

    return {
      id: input.view.id,
    };
  }
}
