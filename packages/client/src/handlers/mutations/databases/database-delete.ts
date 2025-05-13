import { MutationHandler } from '../../../lib/types';
import {
  DatabaseDeleteMutationInput,
  DatabaseDeleteMutationOutput,
} from '../../../mutations/databases/database-delete';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class DatabaseDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DatabaseDeleteMutationInput>
{
  async handleMutation(
    input: DatabaseDeleteMutationInput
  ): Promise<DatabaseDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.databaseId);

    return {
      success: true,
    };
  }
}
