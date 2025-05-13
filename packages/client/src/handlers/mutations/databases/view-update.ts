import { DatabaseViewAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  ViewUpdateMutationInput,
  ViewUpdateMutationOutput,
} from '../../../mutations/databases/view-update';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class ViewUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewUpdateMutationInput>
{
  async handleMutation(
    input: ViewUpdateMutationInput
  ): Promise<ViewUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<DatabaseViewAttributes>(
      input.viewId,
      () => {
        return input.view;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ViewUpdateForbidden,
        "You don't have permission to update this view."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.ViewUpdateFailed,
        'Something went wrong while updating the view.'
      );
    }

    return {
      id: input.viewId,
    };
  }
}
