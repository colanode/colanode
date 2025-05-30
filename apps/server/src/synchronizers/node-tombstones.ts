import {
  SynchronizerOutputMessage,
  SyncNodeTombstonesInput,
  SyncNodeTombstoneData,
} from '@colanode/core';
import { database } from '@colanode/server/data/database';
import { SelectNodeTombstone } from '@colanode/server/data/schema';
import { BaseSynchronizer } from '@colanode/server/synchronizers/base';
import { Event } from '@colanode/server/types/events';

export class NodeTombstoneSynchronizer extends BaseSynchronizer<SyncNodeTombstonesInput> {
  public async fetchData(): Promise<SynchronizerOutputMessage<SyncNodeTombstonesInput> | null> {
    const nodeTombstones = await this.fetchNodeTombstones();
    if (nodeTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(nodeTombstones);
  }

  public async fetchDataFromEvent(
    event: Event
  ): Promise<SynchronizerOutputMessage<SyncNodeTombstonesInput> | null> {
    if (!this.shouldFetch(event)) {
      return null;
    }

    const nodeTombstones = await this.fetchNodeTombstones();
    if (nodeTombstones.length === 0) {
      return null;
    }

    return this.buildMessage(nodeTombstones);
  }

  private async fetchNodeTombstones() {
    if (this.status === 'fetching') {
      return [];
    }

    this.status = 'fetching';
    const nodeTombstones = await database
      .selectFrom('node_tombstones')
      .selectAll()
      .where('root_id', '=', this.input.rootId)
      .where('revision', '>', this.cursor)
      .orderBy('revision', 'asc')
      .limit(20)
      .execute();

    this.status = 'pending';
    return nodeTombstones;
  }

  private buildMessage(
    unsyncedNodeTombstones: SelectNodeTombstone[]
  ): SynchronizerOutputMessage<SyncNodeTombstonesInput> {
    const items: SyncNodeTombstoneData[] = unsyncedNodeTombstones.map(
      (nodeTombstone) => ({
        id: nodeTombstone.id,
        rootId: nodeTombstone.root_id,
        workspaceId: nodeTombstone.workspace_id,
        deletedAt: nodeTombstone.deleted_at.toISOString(),
        deletedBy: nodeTombstone.deleted_by,
        revision: nodeTombstone.revision.toString(),
      })
    );

    return {
      type: 'synchronizer_output',
      userId: this.user.userId,
      id: this.id,
      items: items.map((item) => ({
        cursor: item.revision,
        data: item,
      })),
    };
  }

  private shouldFetch(event: Event) {
    if (event.type === 'node_deleted' && event.rootId === this.input.rootId) {
      return true;
    }

    return false;
  }
}
