import { nodeService } from '@/main/services/node-service';
import { MutationHandler } from '@/main/types';
import {
  FieldDeleteMutationInput,
  FieldDeleteMutationOutput,
} from '@/shared/mutations/databases/field-delete';

export class FieldDeleteMutationHandler
  implements MutationHandler<FieldDeleteMutationInput>
{
  async handleMutation(
    input: FieldDeleteMutationInput
  ): Promise<FieldDeleteMutationOutput> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Invalid node type');
        }

        delete attributes.fields[input.fieldId];

        return attributes;
      }
    );

    return {
      id: input.fieldId,
    };
  }
}
