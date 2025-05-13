import { RecordAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  RecordNameUpdateMutationInput,
  RecordNameUpdateMutationOutput,
} from '../../../mutations/records/record-name-update';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
