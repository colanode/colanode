import { generateId, IdType } from '@colanode/core';

import { MutationHandler } from '../../../lib/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '../../../mutations/files/file-create';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class FileCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const fileId = generateId(IdType.File);
    await workspace.files.createFile(fileId, input.parentId, input.filePath);

    return {
      id: fileId,
    };
  }
}
