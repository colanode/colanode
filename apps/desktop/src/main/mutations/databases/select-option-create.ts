import {
  compareString,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  SelectOptionCreateMutationInput,
  SelectOptionCreateMutationOutput,
} from '@/shared/mutations/databases/select-option-create';
import { MutationError } from '@/shared/mutations';

export class SelectOptionCreateMutationHandler
  implements MutationHandler<SelectOptionCreateMutationInput>
{
  async handleMutation(
    input: SelectOptionCreateMutationInput
  ): Promise<SelectOptionCreateMutationOutput> {
    const id = generateId(IdType.SelectOption);
    const result = await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new MutationError(
            'invalid_attributes',
            'Node is not a database'
          );
        }

        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new MutationError(
            'field_not_found',
            'The field you are trying to create a select option in does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            'invalid_field_type',
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
        'unauthorized',
        "You don't have permission to create a select option in this field."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while creating the select option.'
      );
    }

    return {
      id: id,
    };
  }
}
