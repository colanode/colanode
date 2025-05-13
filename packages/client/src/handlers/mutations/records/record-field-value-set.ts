import { RecordAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import { MutationError, MutationErrorCode } from '../../../mutations';
import {
  RecordFieldValueSetMutationInput,
  RecordFieldValueSetMutationOutput,
} from '../../../mutations/records/record-field-value-set';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class RecordFieldValueSetMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordFieldValueSetMutationInput>
{
  async handleMutation(
    input: RecordFieldValueSetMutationInput
  ): Promise<RecordFieldValueSetMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<RecordAttributes>(
      input.recordId,
      (attributes) => {
        attributes.fields[input.fieldId] = input.value;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateForbidden,
        "You don't have permission to set this field value."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.RecordUpdateFailed,
        'Something went wrong while setting the field value.'
      );
    }

    return {
      success: true,
    };
  }
}
