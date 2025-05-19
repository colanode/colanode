import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  DatabaseUpdateMutationInput,
  DatabaseUpdateMutationOutput,
} from '@colanode/client/mutations/databases/database-update';
import { DatabaseAttributes } from '@colanode/core';

export class DatabaseUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DatabaseUpdateMutationInput>
{
  async handleMutation(
    input: DatabaseUpdateMutationInput
  ): Promise<DatabaseUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const result = await workspace.nodes.updateNode<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.DatabaseUpdateForbidden,
        "You don't have permission to update this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.DatabaseUpdateFailed,
        'Something went wrong while updating the database.'
      );
    }

    return {
      success: true,
    };
  }
}
