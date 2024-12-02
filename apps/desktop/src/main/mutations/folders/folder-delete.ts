import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FolderDeleteMutationInput,
  FolderDeleteMutationOutput,
} from '@/shared/mutations/folders/folder-delete';

export class FolderDeleteMutationHandler
  implements MutationHandler<FolderDeleteMutationInput>
{
  async handleMutation(
    input: FolderDeleteMutationInput
  ): Promise<FolderDeleteMutationOutput> {
    await nodeService.deleteNode(input.folderId, input.userId);

    return {
      success: true,
    };
  }
}
