import { MutationHandler } from '../../../lib/types';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '../../../mutations/databases/view-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class ViewDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<ViewDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.viewId);

    return {
      id: input.viewId,
    };
  }
}
