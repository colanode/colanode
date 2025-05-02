import { Document } from '@/shared/types/documents';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { DocumentGetQueryInput } from '@/shared/queries/documents/document-get';
import { mapDocument } from '@/main/lib/mappers';

export class DocumentGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput
  ): Promise<Document | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const document = await workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();

    if (!document) {
      return null;
    }

    return mapDocument(document);
  }

  public async checkForChanges(
    event: Event,
    input: DocumentGetQueryInput,
    _: Document | null
  ): Promise<ChangeCheckResult<DocumentGetQueryInput>> {
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
      event.type === 'document_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.document.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: event.document,
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
