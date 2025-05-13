import { MutationHandler } from '../../../lib/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '../../../mutations/files/file-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class FileDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.fileId);

    return {
      success: true,
    };
  }
}
