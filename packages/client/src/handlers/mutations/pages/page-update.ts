import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  PageUpdateMutationInput,
  PageUpdateMutationOutput,
} from '@colanode/client/mutations/pages/page-update';
import { PageAttributes } from '@colanode/core';

export class PageUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<PageUpdateMutationInput>
{
  async handleMutation(
    input: PageUpdateMutationInput
  ): Promise<PageUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<PageAttributes>(
      input.pageId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.PageUpdateForbidden,
        "You don't have permission to update this page."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.PageUpdateFailed,
        'Something went wrong while updating the page. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
