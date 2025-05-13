import {
  PageDeleteMutationInput,
  PageDeleteMutationOutput,
} from '../../../mutations/pages/page-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';
import { MutationHandler } from '../../../lib/types';

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
