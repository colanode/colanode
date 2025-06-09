import {
  SynchronizerOutputMessage,
  SyncNodeInteractionsInput,
  SyncNodeInteractionData,
  createDebugger,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectNodeInteraction } from '@colanode/server/data/schema';
import { BaseSynchronizer } from '@colanode/server/synchronizers/base';
import { Event } from '@colanode/server/types/events';

const debug = createDebugger('node-interaction-synchronizer');

export class NodeInteractionSynchronizer extends BaseSynchronizer<SyncNodeInteractionsInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncNodeInteractionsInput> | null> {
    const nodeInteractions = await this.fetchNodeInteractions();
    if (nodeInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(nodeInteractions);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncNodeInteractionsInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const nodeInteractions = await this.fetchNodeInteractions();
    if (nodeInteractions.length === 0) {
      return null;
    }

    return this.buildMessage(nodeInteractions);
  }

  private async fetchNodeInteractions() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';

    try {
      const nodeInteractions = await database
        .selectFrom('node_interactions')
        .selectAll()
        .where('root_id', '=', this.input.rootId)
        .where('revision', '>', this.cursor)
        .orderBy('revision', 'asc')
        .limit(20)
        .execute();

      return nodeInteractions;
    } catch (error) {
      debug('Error fetching node interactions for sync', error);
    } finally {
      this.status = 'pending';
    }

    return [];
  }

  private buildMessage(
    unsyncedNodeInteractions: SelectNodeInteraction[]
  ): SynchronizerOutputMessage<SyncNodeInteractionsInput> {
    const items: SyncNodeInteractionData[] = unsyncedNodeInteractions.map(
      (nodeInteraction) => ({
        nodeId: nodeInteraction.node_id,
        collaboratorId: nodeInteraction.collaborator_id,
        firstSeenAt: nodeInteraction.first_seen_at?.toISOString() ?? null,
        lastSeenAt: nodeInteraction.last_seen_at?.toISOString() ?? null,
        firstOpenedAt: nodeInteraction.first_opened_at?.toISOString() ?? null,
        lastOpenedAt: nodeInteraction.last_opened_at?.toISOString() ?? null,
        rootId: nodeInteraction.root_id,
        workspaceId: nodeInteraction.workspace_id,
        revision: nodeInteraction.revision.toString(),
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
      event.type === 'node.interaction.updated' &&
      event.rootId === this.input.rootId
    ) {
      return true;
    }

    return false;
  }
}
