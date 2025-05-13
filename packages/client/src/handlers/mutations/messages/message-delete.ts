import { MutationHandler } from '../../../lib/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '../../../mutations/messages/message-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
