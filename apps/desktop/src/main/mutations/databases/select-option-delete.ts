import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import { MutationError } from '@/shared/mutations';
import {
  SelectOptionDeleteMutationInput,
  SelectOptionDeleteMutationOutput,
} from '@/shared/mutations/databases/select-option-delete';

export class SelectOptionDeleteMutationHandler
  implements MutationHandler<SelectOptionDeleteMutationInput>
{
  async handleMutation(
    input: SelectOptionDeleteMutationInput
  ): Promise<SelectOptionDeleteMutationOutput> {
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
            'The field you are trying to delete a select option from does not exist.'
          );
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new MutationError(
            'invalid_field_type',
            'The field you are trying to delete a select option from is not a "Select" or "Multi-Select" field.'
          );
        }

        if (!field.options) {
          throw new MutationError(
            'select_option_not_found',
            'The field you are trying to delete a select option from does not have any select options.'
          );
        }

        if (!field.options[input.optionId]) {
          throw new MutationError(
            'select_option_not_found',
            'The select option you are trying to delete does not exist.'
          );
        }

        delete field.options[input.optionId];

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to delete this select option."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while deleting the select option.'
      );
    }

    return {
      id: input.optionId,
    };
  }
}
