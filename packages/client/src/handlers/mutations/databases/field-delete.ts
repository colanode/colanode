import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  FieldDeleteMutationInput,
  FieldDeleteMutationOutput,
} from '@colanode/client/mutations/databases/field-delete';
import { DatabaseAttributes } from '@colanode/core';

export class FieldDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FieldDeleteMutationInput>
{
  async handleMutation(
    input: FieldDeleteMutationInput
  ): Promise<FieldDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        delete attributes.fields[input.fieldId];

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.FieldDeleteForbidden,
        "You don't have permission to delete this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.FieldDeleteFailed,
        'Something went wrong while deleting the field.'
      );
    }

    return {
      id: input.fieldId,
    };
  }
}
