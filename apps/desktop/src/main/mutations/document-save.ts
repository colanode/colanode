import { Block } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  DocumentSaveMutationInput,
  DocumentSaveMutationOutput,
} from '@/shared/mutations/document-save';

export class DocumentSaveMutationHandler
  implements MutationHandler<DocumentSaveMutationInput>
{
  async handleMutation(
    input: DocumentSaveMutationInput
  ): Promise<DocumentSaveMutationOutput> {
    await nodeService.updateNode(
      input.documentId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'page' && attributes.type !== 'record') {
          throw new Error('Invalid node type');
        }

        const blocksMap = new Map<string, Block>();
        if (attributes.content) {
          for (const [key, value] of Object.entries(attributes.content)) {
            blocksMap.set(key, value);
          }
        }

        const blocks = mapContentsToBlocks(
          input.documentId,
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

    return {
      success: true,
    };
  }
}
