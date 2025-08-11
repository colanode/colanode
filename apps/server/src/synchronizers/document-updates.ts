import {
  SynchronizerOutputMessage,
  SyncDocumentUpdatesInput,
  SyncDocumentUpdateData,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';
import { database } from '@colanode/server/data/database';
import { SelectDocumentUpdate } from '@colanode/server/data/schema';
import { createLogger } from '@colanode/server/lib/logger';
import { BaseSynchronizer } from '@colanode/server/synchronizers/base';
import { Event } from '@colanode/server/types/events';

const logger = createLogger('document-update-synchronizer');

export class DocumentUpdateSynchronizer extends BaseSynchronizer<SyncDocumentUpdatesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncDocumentUpdatesInput> | null> {
    const documentUpdates = await this.fetchDocumentUpdates();
    if (documentUpdates.length === 0) {
      return null;
    }

    return this.buildMessage(documentUpdates);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncDocumentUpdatesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const documentUpdates = await this.fetchDocumentUpdates();
    if (documentUpdates.length === 0) {
      return null;
    }

    return this.buildMessage(documentUpdates);
  }

  private async fetchDocumentUpdates() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';

    try {
      const documentUpdates = await database
        .selectFrom('document_updates')
        .selectAll()
        .where('root_id', '=', this.input.rootId)
        .where('revision', '>', this.cursor)
        .orderBy('revision', 'asc')
        .limit(20)
        .execute();

      return documentUpdates;
    } catch (error) {
      logger.error(error, 'Error fetching document updates for sync');
    } finally {
      this.status = 'pending';
    }

    return [];
  }

  private buildMessage(
    unsyncedDocumentUpdates: SelectDocumentUpdate[]
  ): SynchronizerOutputMessage<SyncDocumentUpdatesInput> {
    const items: SyncDocumentUpdateData[] = unsyncedDocumentUpdates.map(
      (documentUpdate) => ({
        id: documentUpdate.id,
        documentId: documentUpdate.document_id,
        rootId: documentUpdate.root_id,
        workspaceId: documentUpdate.workspace_id,
        revision: documentUpdate.revision.toString(),
        data: encodeState(documentUpdate.data),
        createdAt: documentUpdate.created_at.toISOString(),
        createdBy: documentUpdate.created_by,
        mergedUpdates: documentUpdate.merged_updates,
      })
    );

    return {
      type: 'synchronizer.output',
      userId: this.user.userId,
      id: this.id,
      items: items.map((item) => ({
        cursor: item.revision,
        data: item,
      })),
    };
  }

  private shouldFetch(event: Event) {
    if (
      event.type === 'document.update.created' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
