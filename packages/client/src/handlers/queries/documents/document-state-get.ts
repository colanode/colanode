import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDocumentState } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DocumentStateGetQueryInput } from '@colanode/client/queries/documents/document-state-get';
import { DocumentState } from '@colanode/client/types/documents';
import { Event } from '@colanode/client/types/events';

export class DocumentStateGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DocumentStateGetQueryInput>
{
  public async handleQuery(
    input: DocumentStateGetQueryInput
  ): Promise<DocumentState | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const documentState = await workspace.database
      .selectFrom('document_states')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();

    if (!documentState) {
      return null;
    }

    return mapDocumentState(documentState);
  }

  public async checkForChanges(
    event: Event,
    input: DocumentStateGetQueryInput,
    _: DocumentState | null
  ): Promise<ChangeCheckResult<DocumentStateGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'document.state.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentState.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: event.documentState,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.documentId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }
}
