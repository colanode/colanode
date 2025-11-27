import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@colanode/client/mutations';

export class FileDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.userId);
    await workspace.nodes.deleteNode(input.fileId);

    return {
      success: true,
    };
  }
}
