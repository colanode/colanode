import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  FolderUpdateMutationInput,
  FolderUpdateMutationOutput,
} from '@colanode/client/mutations';
import { FolderAttributes } from '@colanode/core';

export class FolderUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FolderUpdateMutationInput>
{
  async handleMutation(
    input: FolderUpdateMutationInput
  ): Promise<FolderUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<FolderAttributes>(
      input.folderId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.FolderUpdateForbidden,
        "You don't have permission to update this folder."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.FolderUpdateFailed,
        'There was an error while updating the folder. Please try again.'
      );
    }

    return {
      success: true,
    };
  }
}
