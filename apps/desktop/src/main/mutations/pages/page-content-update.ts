import { Block } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  PageContentUpdateMutationInput,
  PageContentUpdateMutationOutput,
} from '@/shared/mutations/pages/page-content-update';
import { MutationError } from '@/shared/mutations';

export class PageContentUpdateMutationHandler
  implements MutationHandler<PageContentUpdateMutationInput>
{
  async handleMutation(
    input: PageContentUpdateMutationInput
  ): Promise<PageContentUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.pageId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'page') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        const blocksMap = new Map<string, Block>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.pageId,
          input.content.content ?? [],
          blocksMap
        );

        attributes.content = blocks.reduce(
          (acc, block) => {
            acc[block.id] = block;
            return acc;
          },
          {} as Record<string, Block>
        );

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
        'Something went wrong while updating the page content.'
      );
    }

    return {
      success: true,
    };
  }
}
