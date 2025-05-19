import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@colanode/client/mutations';

export class MessageDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageDeleteMutationInput>
{
  async handleMutation(
    input: MessageDeleteMutationInput
  ): Promise<MessageDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.messageId);

    return {
      success: true,
    };
  }
}
