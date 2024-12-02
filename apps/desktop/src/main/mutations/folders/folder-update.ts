import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  FolderUpdateMutationInput,
  FolderUpdateMutationOutput,
} from '@/shared/mutations/folders/folder-update';

export class FolderUpdateMutationHandler
  implements MutationHandler<FolderUpdateMutationInput>
{
  async handleMutation(
    input: FolderUpdateMutationInput
  ): Promise<FolderUpdateMutationOutput> {
    const result = await nodeService.updateNode(
      input.folderId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'folder') {
          throw new MutationError('invalid_attributes', 'Node is not a folder');
        }

        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this folder."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the folder.'
      );
    }

    return {
      success: true,
    };
  }
}
