import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FolderDeleteMutationInput,
  FolderDeleteMutationOutput,
} from '@colanode/client/mutations';

export class FolderDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FolderDeleteMutationInput>
{
  async handleMutation(
    input: FolderDeleteMutationInput
  ): Promise<FolderDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    await workspace.nodes.deleteNode(input.folderId);

    return {
      success: true,
    };
  }
}
