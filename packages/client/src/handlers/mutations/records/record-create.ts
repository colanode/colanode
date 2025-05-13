import { generateId, IdType, RecordAttributes } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import {
  RecordCreateMutationInput,
  RecordCreateMutationOutput,
} from '../../../mutations/records/record-create';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

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
