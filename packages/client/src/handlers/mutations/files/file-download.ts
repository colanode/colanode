import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@colanode/client/mutations';

export class FileDownloadMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const path = input.path;

    if (!path) {
      const autoDownload = await workspace.files.initAutoDownload(input.fileId);
      return {
        success: !!autoDownload,
      };
    }

    const manualDownload = await workspace.files.initManualDownload(
      input.fileId,
      path
    );

    return {
      success: !!manualDownload,
    };
  }
}
