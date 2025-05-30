import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '@colanode/client/mutations/databases/view-delete';

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
