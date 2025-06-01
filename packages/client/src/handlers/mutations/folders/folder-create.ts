import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FolderCreateMutationInput,
  FolderCreateMutationOutput,
} from '@colanode/client/mutations';
import { FolderAttributes, generateId, IdType } from '@colanode/core';

export class FolderCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput
  ): Promise<FolderCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const id = generateId(IdType.Folder);
    const attributes: FolderAttributes = {
      type: 'folder',
      parentId: input.parentId,
      name: input.name,
      avatar: input.avatar,
    };

    await workspace.nodes.createNode({
      id,
      attributes,
      parentId: input.parentId,
    });

    return {
      id: id,
    };
  }
}
