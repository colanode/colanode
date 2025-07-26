import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FileDownloadMutationInput,
  FileDownloadMutationOutput,
} from '@colanode/client/mutations';
import { DownloadType } from '@colanode/client/types';

export class FileDownloadMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<FileDownloadMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const type = input.path ? DownloadType.Manual : DownloadType.Auto;

    if (type === DownloadType.Auto) {
      const autoDownload = await workspace.files.initAutoDownload(input.fileId);
      return {
        success: !!autoDownload,
      };
    }

    const manualDownload = await workspace.files.initManualDownload(
      input.fileId
    );

    return {
      success: !!manualDownload,
    };
  }
}
