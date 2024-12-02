import { Block } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  RecordContentUpdateMutationInput,
  RecordContentUpdateMutationOutput,
} from '@/shared/mutations/records/record-content-update';

export class RecordContentUpdateMutationHandler
  implements MutationHandler<RecordContentUpdateMutationInput>
{
  async handleMutation(
    input: RecordContentUpdateMutationInput
  ): Promise<RecordContentUpdateMutationOutput> {
    await nodeService.updateNode(input.recordId, input.userId, (attributes) => {
      if (attributes.type !== 'record') {
        throw new Error('Invalid node type');
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
    });

    return {
      success: true,
    };
  }
}
