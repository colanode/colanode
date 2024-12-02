import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  PageDeleteMutationInput,
  PageDeleteMutationOutput,
} from '@/shared/mutations/pages/page-delete';

export class PageDeleteMutationHandler
  implements MutationHandler<PageDeleteMutationInput>
{
  async handleMutation(
    input: PageDeleteMutationInput
  ): Promise<PageDeleteMutationOutput> {
    await nodeService.deleteNode(input.pageId, input.userId);

    return {
      success: true,
    };
  }
}
