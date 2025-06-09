import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDocumentUpdate } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DocumentUpdatesListQueryInput } from '@colanode/client/queries/documents/document-updates-list';
import { DocumentUpdate } from '@colanode/client/types/documents';
import { Event } from '@colanode/client/types/events';

export class DocumentUpdatesListQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DocumentUpdatesListQueryInput>
{
  public async handleQuery(
    input: DocumentUpdatesListQueryInput
  ): Promise<DocumentUpdate[]> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const documentUpdates = await workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', input.documentId)
      .execute();

    if (!documentUpdates) {
      return [];
    }

    return documentUpdates.map((update) => mapDocumentUpdate(update));
  }

  public async checkForChanges(
    event: Event,
    input: DocumentUpdatesListQueryInput,
    output: DocumentUpdate[]
  ): Promise<ChangeCheckResult<DocumentUpdatesListQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'document.update.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentUpdate.documentId === input.documentId
    ) {
      const newOutput = [...output, event.documentUpdate];
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'document.update.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentId === input.documentId
    ) {
      const newOutput = output.filter((update) => update.id !== event.updateId);

      return {
        hasChanges: true,
        result: newOutput,
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
        result: [],
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
