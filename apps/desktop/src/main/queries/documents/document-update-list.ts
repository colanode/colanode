import { DocumentUpdate } from '@/shared/types/documents';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { DocumentUpdatesListQueryInput } from '@/shared/queries/documents/document-updates-list';
import { mapDocumentUpdate } from '@/main/lib/mappers';

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
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: [],
      };
    }

    if (
      event.type === 'document_update_created' &&
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
      event.type === 'document_update_deleted' &&
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
      event.type === 'node_deleted' &&
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
