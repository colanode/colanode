import { FolderAttributes, generateId, IdType } from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FolderCreateMutationInput,
  FolderCreateMutationOutput,
} from '@/shared/mutations/folders/folder-create';

export class FolderCreateMutationHandler
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput
  ): Promise<FolderCreateMutationOutput> {
    const id = generateId(IdType.Folder);
    const attributes: FolderAttributes = {
      type: 'folder',
      parentId: input.parentId,
      name: input.name,
      avatar: input.avatar,
      collaborators: {},
    };

    await nodeService.createNode(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}