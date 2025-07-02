import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { mapNode } from '@colanode/client/lib/mappers';
import { MutationHandler } from '@colanode/client/lib/types';
import { MutationError, MutationErrorCode } from '@colanode/client/mutations';
import {
  FileSaveMutationInput,
  FileSaveMutationOutput,
} from '@colanode/client/mutations/files/file-save';
import { LocalFileNode } from '@colanode/client/types';
import { FileStatus } from '@colanode/core';

export class FileSaveMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileSaveMutationInput>
{
  async handleMutation(
    input: FileSaveMutationInput
  ): Promise<FileSaveMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const node = await workspace.database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!node) {
      throw new MutationError(
        MutationErrorCode.FileNotFound,
        'The file you are trying to save does not exist.'
      );
    }

    const file = mapNode(node) as LocalFileNode;
    if (file.attributes.status !== FileStatus.Ready) {
      throw new MutationError(
        MutationErrorCode.FileNotReady,
        'The file you are trying to download is not uploaded by the author yet.'
      );
    }

    workspace.files.saveFile(file, input.path);

    return {
      success: true,
    };
  }
}
