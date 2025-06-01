import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  PageDeleteMutationInput,
  PageDeleteMutationOutput,
} from '@colanode/client/mutations/pages/page-delete';

export class PageDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<PageDeleteMutationInput>
{
  async handleMutation(
    input: PageDeleteMutationInput
  ): Promise<PageDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.pageId);

    return {
      success: true,
    };
  }
}
