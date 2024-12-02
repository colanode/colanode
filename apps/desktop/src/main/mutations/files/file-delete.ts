import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@/shared/mutations/files/file-delete';

export class FileDeleteMutationHandler
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    await nodeService.deleteNode(input.fileId, input.userId);

    return {
      success: true,
    };
  }
}
