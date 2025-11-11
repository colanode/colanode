import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { mapDocument } from '@colanode/client/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib/types';
import { DocumentGetQueryInput } from '@colanode/client/queries/documents/document-get';
import { Document } from '@colanode/client/types/documents';
import { Event } from '@colanode/client/types/events';

export class DocumentGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput
  ): Promise<Document | null> {
    const workspace = this.getWorkspace(input.userId);
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
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'document.updated' &&
      event.workspace.userId === input.userId &&
      event.document.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: event.document,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.workspace.userId === input.userId &&
      event.node.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'node.created' &&
      event.workspace.userId === input.userId &&
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
