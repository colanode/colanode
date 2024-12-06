import {
  CollaborationsBatchMessage,
  DeletedCollaborationsBatchMessage,
  InitSyncConsumerMessage,
  GetTransactionsOutput,
  InteractionsBatchMessage,
  LocalTransaction,
  TransactionsBatchMessage,
  SyncInteractionsMessage,
  SyncTransactionsOutput,
  SyncConsumerType,
} from '@colanode/core';
import { sql } from 'kysely';

import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import {
  SelectInteractionEvent,
  SelectTransaction,
} from '@/main/data/workspace/schema';
import { collaborationService } from '@/main/services/collaboration-service';
import { interactionService } from '@/main/services/interaction-service';
import { nodeService } from '@/main/services/node-service';
import { serverService } from '@/main/services/server-service';
import { socketService } from '@/main/services/socket-service';
import { fetchWorkspaceCredentials, mapTransaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private readonly debug = createDebugger('service:sync');
  private readonly localPendingTransactionStates: Map<
    string,
    WorkspaceSyncState
  > = new Map();

  private readonly localIncompleteTransactionStates: Map<
    string,
    WorkspaceSyncState
  > = new Map();

  private readonly localPendingInteractionStates: Map<
    string,
    WorkspaceSyncState
  > = new Map();

  private readonly syncingTransactions: Set<string> = new Set();
  private readonly syncingCollaborations: Set<string> = new Set();
  private readonly syncingDeletedCollaborations: Set<string> = new Set();
  private readonly syncingInteractions: Set<string> = new Set();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'transaction_created') {
        this.syncLocalPendingTransactions(event.userId);
      } else if (event.type === 'transaction_incomplete') {
        this.syncLocalIncompleteTransactions(event.userId);
      } else if (event.type === 'workspace_created') {
        this.syncWorkspace(event.workspace.userId);
      } else if (event.type === 'socket_connection_opened') {
        this.syncAllWorkspaces();
      } else if (event.type === 'collaboration_synced') {
        this.checkForMissingNode(event.userId, event.nodeId);
      } else if (event.type === 'interaction_event_created') {
        this.syncLocalPendingInteractions(event.userId);
      }
    });
  }

  public async syncAllWorkspaces() {
    this.debug('Syncing all workspaces');

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      await this.syncWorkspace(workspace.user_id);
    }
  }

  private async syncWorkspace(userId: string) {
    this.syncLocalPendingTransactions(userId);
    this.syncLocalIncompleteTransactions(userId);
    this.syncLocalPendingInteractions(userId);

    this.initSyncConsumer(userId, 'transactions');
    this.initSyncConsumer(userId, 'collaborations');
    this.initSyncConsumer(userId, 'deleted_collaborations');
    this.initSyncConsumer(userId, 'interactions');

    this.syncMissingNodes(userId);
  }

  public async syncLocalPendingTransactions(userId: string) {
    this.debug(`Syncing local pending transactions for user ${userId}`);

    if (!this.localPendingTransactionStates.has(userId)) {
      this.localPendingTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localPendingTransactionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.debug(
        `Syncing of local pending transactions already in progress for user ${userId}, scheduling sync`
      );
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.sendLocalTransactions(userId);
    } catch (error) {
      this.debug(error, `Error syncing local transactions for user ${userId}`);
    } finally {
      syncState.isSyncing = false;
      this.debug(
        `Syncing of local pending transactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalPendingTransactions(userId);
      }
    }
  }

  public async syncLocalPendingInteractions(userId: string) {
    this.debug(`Syncing local pending interactions for user ${userId}`);

    if (!this.localPendingInteractionStates.has(userId)) {
      this.localPendingInteractionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localPendingInteractionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.debug(
        `Syncing of local pending interactions already in progress for user ${userId}, scheduling sync`
      );
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.sendLocalInteractions(userId);
    } catch (error) {
      this.debug(error, `Error syncing local interactions for user ${userId}`);
    } finally {
      syncState.isSyncing = false;
      this.debug(
        `Syncing of local pending interactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalPendingInteractions(userId);
      }
    }
  }

  public async syncLocalIncompleteTransactions(userId: string) {
    this.debug(`Syncing local incomplete transactions for user ${userId}`);

    if (!this.localIncompleteTransactionStates.has(userId)) {
      this.localIncompleteTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localIncompleteTransactionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.debug(
        `Syncing of local incomplete transactions already in progress for user ${userId}, scheduling sync`
      );
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.syncIncompleteTransactions(userId);
    } catch (error) {
      this.debug(
        error,
        `Error syncing incomplete transactions for user ${userId}`
      );
    } finally {
      syncState.isSyncing = false;
      this.debug(
        `Syncing of local incomplete transactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalIncompleteTransactions(userId);
      }
    }
  }

  public async syncServerTransactions(message: TransactionsBatchMessage) {
    this.debug(`Syncing server transactions for user ${message.userId}`);

    if (this.syncingTransactions.has(message.userId)) {
      this.debug(
        `Syncing of server transactions already in progress for user ${message.userId}, skipping`
      );
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
        this.updateCursor(message.userId, 'transactions', cursor);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server transactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server transactions completed for user ${message.userId}`
      );

      this.syncingTransactions.delete(message.userId);
      this.initSyncConsumer(message.userId, 'transactions');
    }
  }

  public async syncServerCollaborations(message: CollaborationsBatchMessage) {
    this.debug(`Syncing server collaborations for user ${message.userId}`);

    if (this.syncingCollaborations.has(message.userId)) {
      this.debug(
        `Syncing of server collaborations already in progress for user ${message.userId}, skipping`
      );
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
        this.updateCursor(message.userId, 'collaborations', cursor);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server collaborations for user ${message.userId}`
      );
    } finally {
      this.syncingCollaborations.delete(message.userId);
      this.initSyncConsumer(message.userId, 'collaborations');
    }
  }

  public async syncServerDeletedCollaborations(
    message: DeletedCollaborationsBatchMessage
  ) {
    this.debug(
      `Syncing server deleted collaborations for user ${message.userId}`
    );

    if (this.syncingDeletedCollaborations.has(message.userId)) {
      this.debug(
        `Syncing of server deleted collaborations already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.syncingDeletedCollaborations.add(message.userId);
    let cursor: bigint | null = null;
    try {
      for (const deletedCollaboration of message.deletedCollaborations) {
        await collaborationService.applyServerDeletedCollaboration(
          message.userId,
          deletedCollaboration
        );
        cursor = BigInt(deletedCollaboration.version);
      }

      if (cursor) {
        this.updateCursor(message.userId, 'deleted_collaborations', cursor);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server deleted collaborations for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server deleted collaborations completed for user ${message.userId}`
      );

      this.syncingDeletedCollaborations.delete(message.userId);
      this.initSyncConsumer(message.userId, 'deleted_collaborations');
    }
  }

  public async syncServerInteractions(message: InteractionsBatchMessage) {
    this.debug(`Syncing server interactions for user ${message.userId}`);

    if (this.syncingInteractions.has(message.userId)) {
      this.debug(
        `Syncing of server interactions already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.syncingInteractions.add(message.userId);
    let cursor: bigint | null = null;
    try {
      for (const interaction of message.interactions) {
        await interactionService.applyServerInteraction(
          message.userId,
          interaction
        );
        cursor = BigInt(interaction.version);
      }

      if (cursor) {
        this.updateCursor(message.userId, 'interactions', cursor);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server interactions for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server interactions completed for user ${message.userId}`
      );

      this.syncingInteractions.delete(message.userId);
      this.initSyncConsumer(message.userId, 'interactions');
    }
  }

  private async syncIncompleteTransactions(userId: string) {
    this.debug(`Syncing incomplete transactions for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const incompleteTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('status', '=', 'incomplete')
      .execute();

    if (incompleteTransactions.length === 0) {
      this.debug(
        `No incomplete transactions found for user ${userId}, skipping`
      );
      return;
    }

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(`No workspace credentials found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping`
      );
      return;
    }

    const groupedByNodeId = incompleteTransactions.reduce<
      Record<string, SelectTransaction[]>
    >((acc, transaction) => {
      acc[transaction.node_id] = [
        ...(acc[transaction.node_id] ?? []),
        transaction,
      ];
      return acc;
    }, {});

    for (const [nodeId, transactions] of Object.entries(groupedByNodeId)) {
      try {
        this.debug(
          `Syncing incomplete transactions for node ${nodeId} for user ${userId}`
        );

        const { data } = await httpClient.get<GetTransactionsOutput>(
          `/v1/workspaces/${credentials.workspaceId}/transactions/${nodeId}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
        );

        if (data.transactions.length === 0) {
          this.debug(
            `No transactions found for node ${nodeId} for user ${userId}, deleting`
          );

          await workspaceDatabase
            .deleteFrom('transactions')
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
          this.debug(
            `Failed to sync transactions for node ${nodeId} for user ${userId}, incrementing retry count`
          );

          await workspaceDatabase
            .updateTable('transactions')
            .set({ retry_count: sql`retry_count + 1` })
            .where(
              'id',
              'in',
              transactions.map((t) => t.id)
            )
            .execute();
        } else {
          this.debug(
            `Successfully synced transactions for node ${nodeId} for user ${userId}, resetting retry count`
          );

          await workspaceDatabase
            .updateTable('transactions')
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
        this.debug(
          error,
          `Error syncing incomplete transactions for node ${nodeId} for user ${userId}`
        );
      }
    }
  }

  private async syncMissingNodes(userId: string) {
    this.debug(`Syncing missing nodes for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const missingNodes = await workspaceDatabase
      .selectFrom('collaborations')
      .leftJoin('nodes', 'collaborations.node_id', 'nodes.id')
      .select('collaborations.node_id')
      .where('nodes.id', 'is', null)
      .execute();

    if (missingNodes.length === 0) {
      this.debug(`No missing nodes found for user ${userId}, skipping`);
      return;
    }

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(`No workspace credentials found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping`
      );
      return;
    }

    for (const node of missingNodes) {
      try {
        this.debug(`Syncing missing node ${node.node_id} for user ${userId}`);

        const { data } = await httpClient.get<GetTransactionsOutput>(
          `/v1/workspaces/${credentials.workspaceId}/transactions/${node.node_id}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
        );

        await nodeService.replaceTransactions(
          userId,
          node.node_id,
          data.transactions
        );
      } catch (error) {
        this.debug(
          error,
          `Error syncing missing node ${node.node_id} for user ${userId}`
        );
      }
    }
  }

  private async checkForMissingNode(userId: string, nodeId: string) {
    this.debug(`Checking for missing node ${nodeId} for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (node) {
      this.debug(`Node ${nodeId} for user ${userId} found, skipping`);
      return;
    }

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(`No workspace credentials found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping`
      );
      return;
    }

    try {
      const { data } = await httpClient.get<GetTransactionsOutput>(
        `/v1/workspaces/${credentials.workspaceId}/transactions/${nodeId}`,
        {
          domain: credentials.serverDomain,
          token: credentials.token,
        }
      );

      await nodeService.replaceTransactions(userId, nodeId, data.transactions);
    } catch (error) {
      this.debug(
        error,
        `Error checking for missing node ${nodeId} for user ${userId}`
      );
    }
  }

  private async sendLocalTransactions(userId: string) {
    this.debug(`Sending local pending transactions for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const unsyncedTransactions = await workspaceDatabase
      .selectFrom('transactions')
      .selectAll()
      .where('status', '=', 'pending')
      .orderBy('id', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      return;
    }

    this.debug(
      `Sending ${unsyncedTransactions.length} local pending transactions for user ${userId}`
    );

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${userId}, skipping sending local pending transactions`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending transactions`
      );
      return;
    }

    const transactions: LocalTransaction[] =
      unsyncedTransactions.map(mapTransaction);
    const { data } = await httpClient.post<SyncTransactionsOutput>(
      `/v1/workspaces/${credentials.workspaceId}/transactions`,
      {
        transactions,
      },
      {
        domain: credentials.serverDomain,
        token: credentials.token,
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
      this.debug(
        `Marking ${syncedTransactionIds.length} local pending transactions as sent for user ${userId}`
      );

      await workspaceDatabase
        .updateTable('transactions')
        .set({ status: 'sent' })
        .where('id', 'in', syncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }

    if (unsyncedTransactionIds.length > 0) {
      this.debug(
        `Marking ${unsyncedTransactionIds.length} local pending transactions as failed for user ${userId}`
      );

      await workspaceDatabase
        .updateTable('transactions')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }
  }

  private async sendLocalInteractions(userId: string) {
    this.debug(`Sending local pending interactions for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${userId}, skipping sending local pending interactions`
      );
      return;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending interactions`
      );
      return;
    }

    const cutoff = new Date(Date.now() - 1000 * 60 * 5).toISOString();
    let cursor = '0';
    let hasMore = true;

    while (hasMore) {
      const interactionEvents = await workspaceDatabase
        .selectFrom('interaction_events')
        .selectAll()
        .where((eb) =>
          eb.or([eb('sent_at', 'is', null), eb('sent_at', '<', cutoff)])
        )
        .where('event_id', '>', cursor)
        .limit(50)
        .execute();

      if (interactionEvents.length === 0) {
        this.debug(
          `No local pending interactions found for user ${userId}, stopping sync`
        );
        hasMore = false;
        break;
      }

      this.debug(
        `Sending ${interactionEvents.length} local pending interactions for user ${userId}`
      );

      const groupedByNodeId: Record<string, SelectInteractionEvent[]> = {};
      for (const event of interactionEvents) {
        groupedByNodeId[event.node_id] = [
          ...(groupedByNodeId[event.node_id] ?? []),
          event,
        ];

        cursor = event.event_id;
      }

      const sentEventIds: string[] = [];
      for (const [nodeId, events] of Object.entries(groupedByNodeId)) {
        if (events.length === 0) {
          continue;
        }

        const firstEvent = events[0];
        if (!firstEvent) {
          continue;
        }

        const message: SyncInteractionsMessage = {
          type: 'sync_interactions',
          nodeId,
          nodeType: firstEvent.node_type,
          userId: credentials.userId,
          events: events.map((e) => ({
            attribute: e.attribute,
            value: e.value,
            createdAt: e.created_at,
          })),
        };

        const sent = socketService.sendMessage(credentials.accountId, message);
        if (sent) {
          sentEventIds.push(...events.map((e) => e.event_id));
        }
      }

      if (sentEventIds.length > 0) {
        this.debug(
          `Marking ${sentEventIds.length} local pending interactions as sent for user ${userId}`
        );

        await workspaceDatabase
          .updateTable('interaction_events')
          .set({ sent_at: new Date().toISOString() })
          .where('event_id', 'in', sentEventIds)
          .execute();
      }
    }
  }

  private async initSyncConsumer(userId: string, type: SyncConsumerType) {
    this.debug(
      `Initializing sync consumer for user ${userId} with type ${type}`
    );

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id', 'workspace_id', 'account_id'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      this.debug(
        `No workspace found for user ${userId}, skipping requiring interactions`
      );
      return;
    }

    const cursor = await this.fetchCursor(userId, type);
    const message: InitSyncConsumerMessage = {
      type: 'init_sync_consumer',
      userId,
      consumerType: type,
      cursor: cursor.toString(),
    };

    socketService.sendMessage(workspace.account_id, message);
  }

  private async updateCursor(
    userId: string,
    type: SyncConsumerType,
    cursor: bigint
  ) {
    this.debug(`Updating cursor ${type} for user ${userId} to ${cursor}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('cursors')
      .values({
        type,
        value: cursor,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('type').doUpdateSet({
          value: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  private async fetchCursor(
    userId: string,
    type: SyncConsumerType
  ): Promise<bigint> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const cursor = await workspaceDatabase
      .selectFrom('cursors')
      .select('value')
      .where('type', '=', type)
      .executeTakeFirst();

    return cursor?.value ?? 0n;
  }
}

export const syncService = new SyncService();
