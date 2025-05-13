import { MutationHandler } from '../../../lib/types';
import {
  DocumentUpdateMutationInput,
  DocumentUpdateMutationOutput,
} from '../../../mutations/documents/document-update';
import { WorkspaceMutationHandlerBase } from '../workspace-mutation-handler-base';

export class DocumentUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DocumentUpdateMutationInput>
{
  async handleMutation(
    input: DocumentUpdateMutationInput
  ): Promise<DocumentUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.documents.updateDocument(input.documentId, input.update);

    return {
      success: true,
    };
  }
}
