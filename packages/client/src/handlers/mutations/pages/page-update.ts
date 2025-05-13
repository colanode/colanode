import { PageAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  PageUpdateMutationInput,
  PageUpdateMutationOutput,
} from '../../../mutations/pages/page-update';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
