import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  RecordCreateMutationInput,
  RecordCreateMutationOutput,
} from '@colanode/client/mutations/records/record-create';
import { generateId, IdType, RecordAttributes } from '@colanode/core';

export class RecordCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<RecordCreateMutationInput>
{
  async handleMutation(
    input: RecordCreateMutationInput
  ): Promise<RecordCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const id = generateId(IdType.Record);
    const attributes: RecordAttributes = {
      type: 'record',
      parentId: input.databaseId,
      databaseId: input.databaseId,
      name: input.name ?? '',
      fields: input.fields ?? {},
    };

    await workspace.nodes.createNode({
      id,
      attributes,
      parentId: input.databaseId,
    });

    return {
      id: id,
    };
  }
}
