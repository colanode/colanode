import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FolderUpdateMutationInput,
  FolderUpdateMutationOutput,
} from '@/shared/mutations/folder-update';

export class FolderUpdateMutationHandler
  implements MutationHandler<FolderUpdateMutationInput>
{
  async handleMutation(
    input: FolderUpdateMutationInput
  ): Promise<FolderUpdateMutationOutput> {
    await nodeService.updateNode(input.folderId, input.userId, (attributes) => {
      if (attributes.type !== 'folder') {
        throw new Error('Node is not a folder');
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
