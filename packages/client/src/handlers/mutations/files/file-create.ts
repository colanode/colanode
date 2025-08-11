import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@colanode/client/mutations';
import { generateId, IdType } from '@colanode/core';

export class FileCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const fileId = generateId(IdType.File);
    await workspace.files.createFile(fileId, input.tempFileId, input.parentId);

    return {
      id: fileId,
    };
  }
}
