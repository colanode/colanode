import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FieldNameUpdateMutationInput,
  FieldNameUpdateMutationOutput,
} from '@/shared/mutations/databases/field-name-update';

export class FieldNameUpdateMutationHandler
  implements MutationHandler<FieldNameUpdateMutationInput>
{
  async handleMutation(
    input: FieldNameUpdateMutationInput
  ): Promise<FieldNameUpdateMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Invalid node type');
        }

        const field = attributes.fields[input.fieldId];
        if (!field) {
          throw new Error('Field not found');
        }

        field.name = input.name;
        return attributes;
      }
    );

    return {
      id: input.fieldId,
    };
  }
}
