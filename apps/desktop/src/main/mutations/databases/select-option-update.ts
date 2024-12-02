import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new Error('Field not found');
        }

        if (field.type !== 'select' && field.type !== 'multiSelect') {
          throw new Error('Field is not a select');
        }

        if (!field.options) {
          field.options = {};
        }

        const option = field.options[input.optionId];
        if (!option) {
          throw new Error('Option not found');
        }

        option.name = input.name;
        option.color = input.color;
        return attributes;
      }
    );

    return {
      id: input.optionId,
    };
  }
}
