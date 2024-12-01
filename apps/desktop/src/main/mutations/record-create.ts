import { generateId, IdType, RecordAttributes } from '@colanode/core';
import { MutationHandler } from '@/main/types';
import {
  RecordCreateMutationInput,
  RecordCreateMutationOutput,
} from '@/shared/mutations/record-create';
import { nodeService } from '@/main/services/node-service';

export class RecordCreateMutationHandler
  implements MutationHandler<RecordCreateMutationInput>
{
  async handleMutation(
    input: RecordCreateMutationInput
  ): Promise<RecordCreateMutationOutput> {
    const id = generateId(IdType.Record);
    const attributes: RecordAttributes = {
      type: 'record',
      parentId: input.databaseId,
      databaseId: input.databaseId,
      name: input.name ?? '',
      fields: input.fields ?? {},
      content: {},
    };

    await nodeService.createNode(input.userId, { id, attributes });

    return {
      id: id,
    };
  }
}
