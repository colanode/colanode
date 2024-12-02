import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  SelectOptionUpdateMutationInput,
  SelectOptionUpdateMutationOutput,
} from '@/shared/mutations/databases/select-option-update';

export class SelectOptionUpdateMutationHandler
  implements MutationHandler<SelectOptionUpdateMutationInput>
{
  async handleMutation(
    input: SelectOptionUpdateMutationInput
  ): Promise<SelectOptionUpdateMutationOutput> {
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
            'The field you are trying to update a select option in does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            'invalid_field_type',
            'The field you are trying to update a select option in is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          field.options = {};
        }

        const option = field.options[input.optionId];
        if (!option) {
          throw new MutationError(
            'select_option_not_found',
            'The select option you are trying to update does not exist.'
          );
        }

        option.name = input.name;
        option.color = input.color;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to update this select option."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while updating the select option.'
      );
    }

    return {
      id: input.optionId,
    };
  }
}
