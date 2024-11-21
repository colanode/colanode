import { databaseService } from '@/main/data/database-service';
import { mapChange } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import {
  LocalChange,
  SyncChangesOutput,
  SyncNodeStatesOutput,
} from '@colanode/core';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { Kysely } from 'kysely';
import { httpClient } from '@/shared/lib/http-client';
import { serverService } from '@/main/services/server-service';
import { nodeService } from '@/main/services/node-service';
import { socketService } from '@/main/services/socket-service';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private syncStates: Map<string, WorkspaceSyncState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'change_created') {
        this.syncWorkspace(event.userId);
      }
    });
  }

  public async syncAllWorkspaces() {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.syncWorkspace(workspace.user_id);
    }
  }

  public async syncWorkspace(userId: string) {
    if (!this.syncStates.has(userId)) {
      this.syncStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.syncStates.get(userId)!;
    if (syncState.isSyncing) {
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.syncWorkspaceChanges(userId);
    } catch (error) {
      console.log('error', error);
    } finally {
      syncState.isSyncing = false;

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncWorkspace(userId);
      }
    }
  }

  private async syncWorkspaceChanges(userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const changes =
      await this.fetchAndCompactWorkspaceChanges(workspaceDatabase);
    if (changes.length === 0) {
      return;
    }

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .innerJoin('accounts', 'workspaces.account_id', 'accounts.id')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select([
        'workspaces.workspace_id',
        'workspaces.user_id',
        'workspaces.account_id',
        'accounts.token',
        'servers.domain',
        'servers.attributes',
      ])
      .where('workspaces.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      return;
    }

    while (changes.length > 0) {
      const changesToSync = changes.splice(0, 20);
      const { data } = await httpClient.post<SyncChangesOutput>(
        `/v1/sync/${workspace.workspace_id}`,
        {
          changes: changesToSync,
        },
        {
          domain: workspace.domain,
          token: workspace.token,
        }
      );

      const syncedChangeIds: number[] = [];
      const unsyncedChangeIds: number[] = [];
      for (const result of data.results) {
        if (result.status === 'success') {
          syncedChangeIds.push(result.id);
        } else {
          unsyncedChangeIds.push(result.id);
        }
      }

      if (syncedChangeIds.length > 0) {
        await workspaceDatabase
          .deleteFrom('changes')
          .where('id', 'in', syncedChangeIds)
          .execute();
      }

      if (unsyncedChangeIds.length > 0) {
        await workspaceDatabase
          .updateTable('changes')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('id', 'in', unsyncedChangeIds)
          .execute();
      }
    }

    const invalidChanges = await this.fetchInvalidChanges(workspaceDatabase);
    if (invalidChanges.length === 0) {
      return;
    }

    const nodeChanges: Record<string, number[]> = {};
    const changesToDelete: number[] = [];
    for (const change of invalidChanges) {
      if (change.retryCount >= 100) {
        // if the change has been retried 100 times, we delete it (it should never happen)
        changesToDelete.push(change.id);
        continue;
      }

      let nodeId: string | null = null;
      if (
        change.data.type === 'node_create' ||
        change.data.type === 'node_update' ||
        change.data.type === 'node_delete'
      ) {
        nodeId = change.data.id;
      } else if (change.data.type === 'user_node_update') {
        nodeId = change.data.nodeId;
      }

      if (nodeId) {
        const changeIds = nodeChanges[nodeId] ?? [];
        changeIds.push(change.id);
        nodeChanges[nodeId] = changeIds;
      }
    }

    const nodeIds = Object.keys(nodeChanges);
    const { data, status } = await httpClient.post<SyncNodeStatesOutput>(
      `/v1/sync/states/${workspace.workspace_id}`,
      {
        nodeIds,
      },
      { domain: workspace.domain, token: workspace.token }
    );

    if (status !== 200) {
      return;
    }

    for (const nodeId of nodeIds) {
      const changeIds = nodeChanges[nodeId] ?? [];
      const states = data.nodes[nodeId];

      if (!states) {
        const deleted = await nodeService.serverDelete(userId, nodeId);
        if (deleted) {
          changesToDelete.push(...changeIds);

          socketService.sendMessage(workspace.account_id, {
            type: 'local_node_delete',
            nodeId,
            workspaceId: workspace.workspace_id,
          });
        }

        continue;
      }

      const nodeSynced = await nodeService.serverSync(userId, states.node);
      if (nodeSynced) {
        changesToDelete.push(...changeIds);
        socketService.sendMessage(workspace.account_id, {
          type: 'local_node_sync',
          nodeId,
          userId,
          versionId: states.node.versionId,
          workspaceId: workspace.workspace_id,
        });

        const userNodeSynced = await nodeService.serverUserNodeSync(
          userId,
          states.userNode
        );

        if (userNodeSynced) {
          socketService.sendMessage(workspace.account_id, {
            type: 'local_user_node_sync',
            nodeId,
            userId,
            versionId: states.userNode.versionId,
            workspaceId: workspace.workspace_id,
          });
        }

        changesToDelete.push(...changeIds);
      }
    }

    if (changesToDelete.length > 0) {
      await workspaceDatabase
        .deleteFrom('changes')
        .where('id', 'in', changesToDelete)
        .execute();
    }
  }

  private async fetchAndCompactWorkspaceChanges(
    database: Kysely<WorkspaceDatabaseSchema>
  ): Promise<LocalChange[]> {
    const changeRows = await database
      .selectFrom('changes')
      .selectAll()
      .orderBy('id asc')
      .limit(1000)
      .execute();

    if (changeRows.length === 0) {
      return [];
    }

    const changes: LocalChange[] = changeRows.map(mapChange);
    const changesToDelete = new Set<number>();
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      if (!change) {
        continue;
      }

      if (changesToDelete.has(change.id)) {
        continue;
      }

      if (change.data.type === 'node_delete') {
        for (let j = i - 1; j >= 0; j--) {
          const otherChange = changes[j];
          if (!otherChange) {
            continue;
          }

          if (
            otherChange.data.type === 'node_create' &&
            otherChange.data.id === change.data.id
          ) {
            // if the node has been created and then deleted, we don't need to sync the delete
            changesToDelete.add(change.id);
            changesToDelete.add(otherChange.id);
          }

          if (
            otherChange.data.type === 'node_update' &&
            otherChange.data.id === change.data.id
          ) {
            changesToDelete.add(otherChange.id);
          }
        }
      } else if (change.data.type === 'user_node_update') {
        for (let j = i - 1; j >= 0; j--) {
          const otherChange = changes[j];
          if (!otherChange) {
            continue;
          }

          if (
            otherChange.data.type === 'user_node_update' &&
            otherChange.data.nodeId === change.data.nodeId &&
            otherChange.data.userId === change.data.userId
          ) {
            changesToDelete.add(otherChange.id);
          }
        }
      }
    }

    if (changesToDelete.size > 0) {
      const toDeleteIds = Array.from(changesToDelete);
      await database
        .deleteFrom('changes')
        .where('id', 'in', toDeleteIds)
        .execute();
    }

    return changes.filter((change) => !changesToDelete.has(change.id));
  }

  private async fetchInvalidChanges(database: Kysely<WorkspaceDatabaseSchema>) {
    const rows = await database
      .selectFrom('changes')
      .selectAll()
      .where('retry_count', '>=', 5)
      .execute();

    if (rows.length === 0) {
      return [];
    }

    return rows.map(mapChange);
  }
}

export const syncService = new SyncService();
