import { Block } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  RecordContentUpdateMutationInput,
  RecordContentUpdateMutationOutput,
} from '@/shared/mutations/records/record-content-update';
import { MutationError } from '@/shared/mutations';

export class RecordContentUpdateMutationHandler
  implements MutationHandler<RecordContentUpdateMutationInput>
{
  async handleMutation(
    input: RecordContentUpdateMutationInput
  ): Promise<RecordContentUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.recordId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'record') {
          throw new MutationError('invalid_attributes', 'Invalid node type');
        }

        const blocksMap = new Map<string, Block>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.recordId,
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
        "You don't have permission to update this record."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the record content.'
      );
    }

    return {
      success: true,
    };
  }
}
