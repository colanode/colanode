import {
  compareString,
  DatabaseAttributes,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import {
  SelectOptionCreateMutationInput,
  SelectOptionCreateMutationOutput,
} from '../../../mutations/databases/select-option-create';
import { MutationError, MutationErrorCode } from '../../../mutations';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class SelectOptionCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SelectOptionCreateMutationInput>
{
  async handleMutation(
    input: SelectOptionCreateMutationInput
  ): Promise<SelectOptionCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const id = generateId(IdType.SelectOption);
    const result = await workspace.nodes.updateNode<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            MutationErrorCode.FieldNotFound,
            'The field you are trying to create a select option in does not exist.'
          );
        }

        if (field.type !== 'multi_select' && field.type !== 'select') {
          throw new MutationError(
            MutationErrorCode.FieldTypeInvalid,
            'The field you are trying to create a select option in is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          field.options = {};
        }

        const maxIndex = Object.values(field.options)
          .map((selectOption) => selectOption.index)
          .sort((a, b) => -compareString(a, b))[0];

        const index = generateNodeIndex(maxIndex, null);

        field.options[id] = {
          name: input.name,
          id: id,
          color: input.color,
          index: index,
        };

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SelectOptionCreateForbidden,
        "You don't have permission to create a select option in this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SelectOptionCreateFailed,
        'Something went wrong while creating the select option.'
      );
    }

    return {
      id: id,
    };
  }
}
