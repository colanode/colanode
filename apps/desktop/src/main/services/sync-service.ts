import { databaseService } from '@/main/data/database-service';
import { mapTransaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import { serverService } from '@/main/services/server-service';
import {
  CollaborationRevocationsBatchMessage,
  CollaborationsBatchMessage,
  FetchCollaborationRevocationsMessage,
  FetchCollaborationsMessage,
  FetchNodeTransactionsMessage,
  GetNodeTransactionsOutput,
  LocalNodeTransaction,
  NodeTransactionsBatchMessage,
  SyncNodeTransactionsOutput,
} from '@colanode/core';
import { logService } from '@/main/services/log-service';
import { nodeService } from '@/main/services/node-service';
import { socketService } from '@/main/services/socket-service';
import { collaborationService } from '@/main/services/collaboration-service';
import { SelectNodeTransaction } from '@/main/data/workspace/schema';
import { sql } from 'kysely';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private readonly logger = logService.createLogger('sync-service');
  private readonly localPendingTransactionStates: Map<
    string,
    WorkspaceSyncState
  > = new Map();

  private readonly localIncompleteTransactionStates: Map<
    string,
    WorkspaceSyncState
  > = new Map();

  private readonly syncingTransactions: Set<string> = new Set();
  private readonly syncingCollaborations: Set<string> = new Set();
  private readonly syncingRevocations: Set<string> = new Set();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'node_transaction_created') {
        this.syncLocalPendingTransactions(event.userId);
      } else if (event.type === 'node_transaction_incomplete') {
        this.syncLocalIncompleteTransactions(event.userId);
      } else if (event.type === 'workspace_created') {
        this.requireNodeTransactions(event.workspace.userId);
      } else if (event.type === 'socket_connection_opened') {
        this.syncAllWorkspaces();
      } else if (event.type === 'collaboration_synced') {
        this.checkForMissingNode(event.userId, event.nodeId);
      }
    });
  }

  public async syncAllWorkspaces() {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.syncLocalPendingTransactions(workspace.user_id);
      this.syncLocalIncompleteTransactions(workspace.user_id);
      this.requireNodeTransactions(workspace.user_id);
      this.requireCollaborations(workspace.user_id);
      this.requireCollaborationRevocations(workspace.user_id);
      this.syncMissingNodes(workspace.user_id);
    }
  }

  public async syncLocalPendingTransactions(userId: string) {
    if (!this.localPendingTransactionStates.has(userId)) {
      this.localPendingTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localPendingTransactionStates.get(userId)!;
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
        this.syncLocalPendingTransactions(userId);
      }
    }
  }

  public async syncLocalIncompleteTransactions(userId: string) {
    if (!this.localIncompleteTransactionStates.has(userId)) {
      this.localIncompleteTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localIncompleteTransactionStates.get(userId)!;
    if (syncState.isSyncing) {
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.syncIncompleteTransactions(userId);
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing incomplete transactions for user ${userId}`
      );
    } finally {
      syncState.isSyncing = false;

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalIncompleteTransactions(userId);
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
        cursor = BigInt(transaction.version);
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
        cursor = BigInt(collaboration.version);
      }

      if (cursor) {
        this.updateCollaborationCursor(message.userId, cursor);
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

  public async syncServerRevocations(
    message: CollaborationRevocationsBatchMessage
  ) {
    if (this.syncingRevocations.has(message.userId)) {
      return;
    }

    this.syncingRevocations.add(message.userId);
    let cursor: bigint | null = null;
    try {
      for (const revocation of message.revocations) {
        await collaborationService.applyServerCollaborationRevocation(
          message.userId,
          revocation
        );
        cursor = BigInt(revocation.version);
      }

      if (cursor) {
        this.updateCollaborationRevocationCursor(message.userId, cursor);
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing server revocations for user ${message.userId}`
      );
    } finally {
      this.syncingRevocations.delete(message.userId);
      this.requireCollaborationRevocations(message.userId);
    }
  }

  private async syncIncompleteTransactions(userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const incompleteTransactions = await workspaceDatabase
      .selectFrom('node_transactions')
      .selectAll()
      .where('status', '=', 'incomplete')
      .execute();

    if (incompleteTransactions.length === 0) {
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

    const groupedByNodeId = incompleteTransactions.reduce<
      Record<string, SelectNodeTransaction[]>
    >((acc, transaction) => {
      acc[transaction.node_id] = [
        ...(acc[transaction.node_id] ?? []),
        transaction,
      ];
      return acc;
    }, {});

    for (const [nodeId, transactions] of Object.entries(groupedByNodeId)) {
      try {
        const { data } = await httpClient.get<GetNodeTransactionsOutput>(
          `/v1/nodes/${workspace.workspace_id}/transactions/${nodeId}`,
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        if (data.transactions.length === 0) {
          await workspaceDatabase
            .deleteFrom('node_transactions')
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .execute();
          continue;
        }

        const synced = await nodeService.replaceTransactions(
          userId,
          nodeId,
          data.transactions
        );

        if (!synced) {
          await workspaceDatabase
            .updateTable('node_transactions')
            .set({ retry_count: sql`retry_count + 1` })
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .execute();
        } else {
          await workspaceDatabase
            .updateTable('node_transactions')
            .set({ retry_count: sql`retry_count + 1` })
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .where('status', '=', 'incomplete')
            .execute();
        }
      } catch (error) {
        this.logger.error(
          error,
          `Error syncing incomplete transactions for node ${nodeId} for user ${userId}`
        );
      }
    }
  }

  private async syncMissingNodes(userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const missingNodes = await workspaceDatabase
      .selectFrom('collaborations')
      .leftJoin('nodes', 'collaborations.node_id', 'nodes.id')
      .select('collaborations.node_id')
      .where('nodes.id', 'is', null)
      .execute();

    console.log('missingNodes', missingNodes);

    if (missingNodes.length === 0) {
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

    for (const node of missingNodes) {
      try {
        const { data } = await httpClient.get<GetNodeTransactionsOutput>(
          `/v1/nodes/${workspace.workspace_id}/transactions/${node.node_id}`,
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        console.log('missing node data', data);

        await nodeService.replaceTransactions(
          userId,
          node.node_id,
          data.transactions
        );
      } catch (error) {
        this.logger.error(
          error,
          `Error syncing missing node ${node.node_id} for user ${userId}`
        );
      }
    }
  }

  private async checkForMissingNode(userId: string, nodeId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (node) {
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

    try {
      const { data } = await httpClient.get<GetNodeTransactionsOutput>(
        `/v1/nodes/${workspace.workspace_id}/transactions/${nodeId}`,
        {
          domain: workspace.domain,
          token: workspace.token,
        }
      );

      await nodeService.replaceTransactions(userId, nodeId, data.transactions);
    } catch (error) {
      this.logger.error(
        error,
        `Error checking for missing node ${nodeId} for user ${userId}`
      );
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
        .where('status', '=', 'pending')
        .execute();
    }

    if (unsyncedTransactionIds.length > 0) {
      await workspaceDatabase
        .updateTable('node_transactions')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedTransactionIds)
        .where('status', '=', 'pending')
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
        'wc.transactions',
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
      cursor: workspaceWithCursor.transactions?.toString() ?? '0',
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
      cursor: workspaceWithCursor.collaborations?.toString() ?? '0',
    };

    socketService.sendMessage(workspaceWithCursor.account_id, message);
  }

  private async requireCollaborationRevocations(userId: string) {
    const workspaceWithCursor = await databaseService.appDatabase
      .selectFrom('workspaces as w')
      .leftJoin('workspace_cursors as wc', 'w.user_id', 'wc.user_id')
      .select(['w.user_id', 'w.workspace_id', 'w.account_id', 'wc.revocations'])
      .where('w.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspaceWithCursor) {
      return;
    }

    const message: FetchCollaborationRevocationsMessage = {
      type: 'fetch_collaboration_revocations',
      userId: workspaceWithCursor.user_id,
      workspaceId: workspaceWithCursor.workspace_id,
      cursor: workspaceWithCursor.revocations?.toString() ?? '0',
    };

    socketService.sendMessage(workspaceWithCursor.account_id, message);
  }

  private async updateNodeTransactionCursor(userId: string, cursor: bigint) {
    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        transactions: cursor,
        collaborations: 0n,
        revocations: 0n,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('user_id').doUpdateSet({
          transactions: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  private async updateCollaborationCursor(userId: string, cursor: bigint) {
    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        collaborations: cursor,
        revocations: 0n,
        transactions: 0n,
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

  private async updateCollaborationRevocationCursor(
    userId: string,
    cursor: bigint
  ) {
    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        revocations: cursor,
        transactions: 0n,
        collaborations: 0n,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('user_id').doUpdateSet({
          revocations: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }
}

export const syncService = new SyncService();
