import { generateId, IdType } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import {
  PageCreateMutationInput,
  PageCreateMutationOutput,
} from '@/shared/mutations/page-create';
import { PageAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class PageCreateMutationHandler
  implements MutationHandler<PageCreateMutationInput>
{
  async handleMutation(
    input: PageCreateMutationInput
  ): Promise<PageCreateMutationOutput> {
    const id = generateId(IdType.Page);
    const attributes: PageAttributes = {
      type: 'page',
      parentId: input.parentId,
      name: input.name,
      content: {},
    };

    await nodeService.createNode(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}