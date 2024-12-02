import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
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

        delete field.options[input.optionId];

        return attributes;
      }
    );

    return {
      id: input.optionId,
    };
  }
}
