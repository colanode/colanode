import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  SelectOptionDeleteMutationInput,
  SelectOptionDeleteMutationOutput,
} from '@colanode/client/mutations/databases/select-option-delete';
import { DatabaseAttributes } from '@colanode/core';

export class SelectOptionDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SelectOptionDeleteMutationInput>
{
  async handleMutation(
    input: SelectOptionDeleteMutationInput
  ): Promise<SelectOptionDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to delete a select option from does not exist.'
          );
        }

        if (field.type !== 'multi_select' && field.type !== 'select') {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to delete a select option from is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          throw new MutationError(
            MutationErrorCode.SelectOptionNotFound,
            'The field you are trying to delete a select option from does not have any select options.'
          );
        }

        if (!field.options[input.optionId]) {
          throw new MutationError(
            MutationErrorCode.SelectOptionNotFound,
            'The select option you are trying to delete does not exist.'
          );
        }

        delete field.options[input.optionId];

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SelectOptionDeleteForbidden,
        "You don't have permission to delete this select option."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SelectOptionDeleteFailed,
        'Something went wrong while deleting the select option.'
      );
    }

    return {
      id: input.optionId,
    };
  }
}
