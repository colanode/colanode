import { MutationHandler } from '../../../lib/types';
import {
  RecordDeleteMutationInput,
  RecordDeleteMutationOutput,
} from '../../../mutations/records/record-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
