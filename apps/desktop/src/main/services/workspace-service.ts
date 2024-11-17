import fs from 'fs';
import { databaseService } from '@/main/data/database-service';
import {
  getWorkspaceDirectoryPath,
  mapChange,
  mapWorkspace,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { LocalChange, SyncChangesOutput } from '@colanode/core';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { Kysely } from 'kysely';
import { httpClient } from '@/shared/lib/http-client';
import { serverService } from '@/main/services/server-service';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class WorkspaceService {
  private syncStates: Map<string, WorkspaceSyncState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'change_created') {
        this.syncWorkspace(event.userId);
      }
    });
  }

  public async deleteWorkspace(userId: string): Promise<boolean> {
    const deletedWorkspace = await databaseService.appDatabase
      .deleteFrom('workspaces')
      .returningAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!deletedWorkspace) {
      return false;
    }

    await databaseService.deleteWorkspaceDatabase(userId);
    const workspaceDir = getWorkspaceDirectoryPath(userId);
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true });
    }

    eventBus.publish({
      type: 'workspace_deleted',
      workspace: mapWorkspace(deletedWorkspace),
    });

    return true;
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

        //we just delete changes that have failed to sync for more than 5 times.
        //in the future we might need to revert the change locally.
        await workspaceDatabase
          .deleteFrom('changes')
          .where('retry_count', '>=', 5)
          .execute();
      }
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

      if (changesToDelete.has(change.id)) {
        continue;
      }

      if (change.data.type === 'node_delete') {
        for (let j = i - 1; j >= 0; j--) {
          const otherChange = changes[j];
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
}

export const workspaceService = new WorkspaceService();
