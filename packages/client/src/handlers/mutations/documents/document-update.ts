import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  DocumentUpdateMutationInput,
  DocumentUpdateMutationOutput,
} from '@colanode/client/mutations';
import { decodeState } from '@colanode/crdt';

export class DocumentUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DocumentUpdateMutationInput>
{
  async handleMutation(
    input: DocumentUpdateMutationInput
  ): Promise<DocumentUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.documents.updateDocument(
      input.documentId,
      decodeState(input.update)
    );

    return {
      success: true,
    };
  }
}
