import { MutationHandler } from '@/main/types';
import {
  PageUpdateMutationInput,
  PageUpdateMutationOutput,
} from '@/shared/mutations/page-update';
import { nodeService } from '@/main/services/node-service';

export class PageUpdateMutationHandler
  implements MutationHandler<PageUpdateMutationInput>
{
  async handleMutation(
    input: PageUpdateMutationInput
  ): Promise<PageUpdateMutationOutput> {
    await nodeService.updateNode(input.pageId, input.userId, (attributes) => {
      if (attributes.type !== 'page') {
        throw new Error('Node is not a page');
      }

      attributes.name = input.name;
      attributes.avatar = input.avatar;

      return attributes;
    });

    return {
      success: true,
    };
  }
}
