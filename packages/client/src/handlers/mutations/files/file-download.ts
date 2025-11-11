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
    const workspace = this.getWorkspace(input.userId);
    const path = input.path;

    const manualDownload = await workspace.files.initManualDownload(
      input.fileId,
      path
    );

    return {
      success: !!manualDownload,
    };
  }
}
