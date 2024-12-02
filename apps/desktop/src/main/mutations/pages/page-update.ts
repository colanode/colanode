import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  PageUpdateMutationInput,
  PageUpdateMutationOutput,
} from '@/shared/mutations/pages/page-update';

export class PageUpdateMutationHandler
  implements MutationHandler<PageUpdateMutationInput>
{
  async handleMutation(
    input: PageUpdateMutationInput
  ): Promise<PageUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.pageId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'page') {
          throw new MutationError('invalid_attributes', 'Node is not a page');
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this page."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the page.'
      );
    }

    return {
      success: true,
    };
  }
}
