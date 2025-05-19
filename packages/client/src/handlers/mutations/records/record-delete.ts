import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  RecordDeleteMutationInput,
  RecordDeleteMutationOutput,
} from '@colanode/client/mutations/records/record-delete';

export class RecordDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordDeleteMutationInput>
{
  async handleMutation(
    input: RecordDeleteMutationInput
  ): Promise<RecordDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.recordId);

    return {
      success: true,
    };
  }
}
