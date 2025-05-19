import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  RecordNameUpdateMutationInput,
  RecordNameUpdateMutationOutput,
} from '@colanode/client/mutations/records/record-name-update';
import { RecordAttributes } from '@colanode/core';

export class RecordNameUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordNameUpdateMutationInput>
{
  async handleMutation(
    input: RecordNameUpdateMutationInput
  ): Promise<RecordNameUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<RecordAttributes>(
      input.recordId,
      (attributes) => {
        attributes.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to update this record."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while updating the record name. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
