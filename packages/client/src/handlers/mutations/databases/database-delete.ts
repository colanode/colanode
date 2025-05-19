import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  DatabaseDeleteMutationInput,
  DatabaseDeleteMutationOutput,
} from '@colanode/client/mutations/databases/database-delete';

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
