import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
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

        const view = attributes.views[input.viewId];
        if (!view) {
          throw new MutationError(
            'view_not_found',
            'The view you are trying to update the name of does not exist.'
          );
        }

        view.name = input.name;
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
      id: input.viewId,
    };
  }
}
