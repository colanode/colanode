import { databaseService } from '@/main/data/database-service';
import { mapTransaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import { serverService } from '@/main/services/server-service';
import {
  CollaborationsBatchMessage,
  FetchCollaborationsMessage,
  FetchNodeTransactionsMessage,
  LocalNodeTransaction,
  NodeTransactionsBatchMessage,
  SyncNodeTransactionsOutput,
} from '@colanode/core';
import { logService } from '@/main/services/log-service';
import { nodeService } from '@/main/services/node-service';
import { socketService } from '@/main/services/socket-service';
import { collaborationService } from '@/main/services/collaboration-service';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private readonly logger = logService.createLogger('sync-service');
  private readonly localSyncStates: Map<string, WorkspaceSyncState> = new Map();

  private readonly syncingTransactions: Set<string> = new Set();
  private readonly syncingCollaborations: Set<string> = new Set();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'node_transaction_created') {
        this.syncLocalTransactions(event.userId);
      } else if (event.type === 'workspace_created') {
        this.requireNodeTransactions(event.workspace.userId);
      } else if (event.type === 'socket_connection_opened') {
        this.requireNodeTransactions(event.accountId);
        this.requireCollaborations(event.accountId);
      }
    });
  }

  public async syncAllWorkspaces() {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.syncLocalTransactions(workspace.user_id);
      this.requireNodeTransactions(workspace.user_id);
      this.requireCollaborations(workspace.user_id);
    }
  }

  public async syncLocalTransactions(userId: string) {
    if (!this.localSyncStates.has(userId)) {
      this.localSyncStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localSyncStates.get(userId)!;
    if (syncState.isSyncing) {
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.sendLocalTransactions(userId);
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing local transactions for user ${userId}`
      );
    } finally {
      syncState.isSyncing = false;

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalTransactions(userId);
      }
    }
  }

  public async syncServerTransactions(message: NodeTransactionsBatchMessage) {
    if (this.syncingTransactions.has(message.userId)) {
      return;
    }

    this.syncingTransactions.add(message.userId);
    let cursor: bigint | null = null;
    try {
      for (const transaction of message.transactions) {
        await nodeService.applyServerTransaction(message.userId, transaction);
        cursor = BigInt(transaction.number);
      }

      if (cursor) {
        this.updateNodeTransactionCursor(message.userId, cursor);
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing server transactions for user ${message.userId}`
      );
    } finally {
      this.syncingTransactions.delete(message.userId);
      this.requireNodeTransactions(message.userId);
    }
  }

  public async syncServerCollaborations(message: CollaborationsBatchMessage) {
    if (this.syncingCollaborations.has(message.userId)) {
      return;
    }

    this.syncingCollaborations.add(message.userId);
    let cursor: bigint | null = null;
    try {
      for (const collaboration of message.collaborations) {
        await collaborationService.applyServerCollaboration(
          message.userId,
          collaboration
        );
        cursor = BigInt(collaboration.number);
      }

      if (cursor) {
        this.updateNodeCollaborationCursor(message.userId, cursor);
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing server collaborations for user ${message.userId}`
      );
    } finally {
      this.syncingCollaborations.delete(message.userId);
      this.requireCollaborations(message.userId);
    }
  }

  private async sendLocalTransactions(userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const unsyncedTransactions = await workspaceDatabase
      .selectFrom('node_transactions')
      .selectAll()
      .where('status', '=', 'pending')
      .orderBy('id', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
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

    const transactions: LocalNodeTransaction[] =
      unsyncedTransactions.map(mapTransaction);
    const { data } = await httpClient.post<SyncNodeTransactionsOutput>(
      `/v1/sync/${workspace.workspace_id}`,
      {
        transactions,
      },
      {
        domain: workspace.domain,
        token: workspace.token,
      }
    );

    const syncedTransactionIds: string[] = [];
    const unsyncedTransactionIds: string[] = [];

    for (const result of data.results) {
      if (result.status === 'success') {
        syncedTransactionIds.push(result.id);
      } else {
        unsyncedTransactionIds.push(result.id);
      }
    }

    if (syncedTransactionIds.length > 0) {
      await workspaceDatabase
        .updateTable('node_transactions')
        .set({ status: 'sent' })
        .where('id', 'in', syncedTransactionIds)
        .execute();
    }

    if (unsyncedTransactionIds.length > 0) {
      await workspaceDatabase
        .updateTable('node_transactions')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedTransactionIds)
        .execute();
    }
  }

  private async requireNodeTransactions(userId: string) {
    const workspaceWithCursor = await databaseService.appDatabase
      .selectFrom('workspaces as w')
      .leftJoin('workspace_cursors as wc', 'w.user_id', 'wc.user_id')
      .select([
        'w.user_id',
        'w.workspace_id',
        'w.account_id',
        'wc.node_transactions',
      ])
      .where('w.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspaceWithCursor) {
      return;
    }

    const message: FetchNodeTransactionsMessage = {
      type: 'fetch_node_transactions',
      userId: workspaceWithCursor.user_id,
      workspaceId: workspaceWithCursor.workspace_id,
      cursor: workspaceWithCursor.node_transactions?.toString() ?? null,
    };

    socketService.sendMessage(workspaceWithCursor.account_id, message);
  }

  private async requireCollaborations(userId: string) {
    const workspaceWithCursor = await databaseService.appDatabase
      .selectFrom('workspaces as w')
      .leftJoin('workspace_cursors as wc', 'w.user_id', 'wc.user_id')
      .select([
        'w.user_id',
        'w.workspace_id',
        'w.account_id',
        'wc.collaborations',
      ])
      .where('w.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspaceWithCursor) {
      return;
    }

    const message: FetchCollaborationsMessage = {
      type: 'fetch_collaborations',
      userId: workspaceWithCursor.user_id,
      workspaceId: workspaceWithCursor.workspace_id,
      cursor: workspaceWithCursor.collaborations?.toString() ?? null,
    };

    socketService.sendMessage(workspaceWithCursor.account_id, message);
  }

  private async updateNodeTransactionCursor(userId: string, cursor: bigint) {
    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        node_transactions: cursor,
        collaborations: 0n,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('user_id').doUpdateSet({
          node_transactions: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  private async updateNodeCollaborationCursor(userId: string, cursor: bigint) {
    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        collaborations: cursor,
        node_transactions: 0n,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('user_id').doUpdateSet({
          collaborations: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }
}

export const syncService = new SyncService();
