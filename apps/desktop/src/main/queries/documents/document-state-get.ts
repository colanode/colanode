import { DocumentState } from '@/shared/types/documents';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { DocumentStateGetQueryInput } from '@/shared/queries/documents/document-state-get';
import { mapDocumentState } from '@/main/lib/mappers';

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
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'document_state_updated' &&
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
      event.type === 'node_deleted' &&
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
      event.type === 'node_created' &&
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
