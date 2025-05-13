import { FolderAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  FolderUpdateMutationInput,
  FolderUpdateMutationOutput,
} from '../../../mutations/folders/folder-update';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
