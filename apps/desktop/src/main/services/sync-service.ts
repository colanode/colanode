import {
  CollaborationRevocationsBatchMessage,
  CollaborationsBatchMessage,
  FetchCollaborationRevocationsMessage,
  FetchCollaborationsMessage,
  FetchInteractionsMessage,
  FetchNodeTransactionsMessage,
  GetNodeTransactionsOutput,
  InteractionsBatchMessage,
  LocalNodeTransaction,
  NodeTransactionsBatchMessage,
  SyncInteractionsMessage,
  SyncNodeTransactionsOutput,
} from '@colanode/core';
import { sql } from 'kysely';

import { databaseService } from '@/main/data/database-service';
import {
  SelectInteractionEvent,
  SelectNodeTransaction,
} from '@/main/data/workspace/schema';
import { createLogger } from '@/main/logger';
import { collaborationService } from '@/main/services/collaboration-service';
import { interactionService } from '@/main/services/interaction-service';
import { nodeService } from '@/main/services/node-service';
import { serverService } from '@/main/services/server-service';
import { socketService } from '@/main/services/socket-service';
import { mapTransaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';

type WorkspaceSyncState = {
  isSyncing: boolean;
  scheduledSync: boolean;
};

class SyncService {
  private readonly logger = createLogger('sync-service');
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
  private readonly syncingRevocations: Set<string> = new Set();
  private readonly syncingInteractions: Set<string> = new Set();

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
      } else if (event.type === 'interaction_event_created') {
        this.syncLocalPendingInteractions(event.userId);
      }
    });
  }

  public async syncAllWorkspaces() {
    this.logger.trace('Syncing all workspaces');

    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .select(['user_id'])
      .execute();

    for (const workspace of workspaces) {
      this.syncLocalPendingTransactions(workspace.user_id);
      this.syncLocalIncompleteTransactions(workspace.user_id);
      this.syncLocalPendingInteractions(workspace.user_id);

      this.requireNodeTransactions(workspace.user_id);
      this.requireCollaborations(workspace.user_id);
      this.requireCollaborationRevocations(workspace.user_id);
      this.requireInteractions(workspace.user_id);

      this.syncMissingNodes(workspace.user_id);
    }
  }

  public async syncLocalPendingTransactions(userId: string) {
    this.logger.trace(`Syncing local pending transactions for user ${userId}`);

    if (!this.localPendingTransactionStates.has(userId)) {
      this.localPendingTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localPendingTransactionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.logger.trace(
        `Syncing of local pending transactions already in progress for user ${userId}, scheduling sync`
      );
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
      this.logger.trace(
        `Syncing of local pending transactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalPendingTransactions(userId);
      }
    }
  }

  public async syncLocalPendingInteractions(userId: string) {
    this.logger.trace(`Syncing local pending interactions for user ${userId}`);

    if (!this.localPendingInteractionStates.has(userId)) {
      this.localPendingInteractionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localPendingInteractionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.logger.trace(
        `Syncing of local pending interactions already in progress for user ${userId}, scheduling sync`
      );
      syncState.scheduledSync = true;
      return;
    }

    syncState.isSyncing = true;
    try {
      await this.sendLocalInteractions(userId);
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing local interactions for user ${userId}`
      );
    } finally {
      syncState.isSyncing = false;
      this.logger.trace(
        `Syncing of local pending interactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalPendingInteractions(userId);
      }
    }
  }

  public async syncLocalIncompleteTransactions(userId: string) {
    this.logger.trace(
      `Syncing local incomplete transactions for user ${userId}`
    );

    if (!this.localIncompleteTransactionStates.has(userId)) {
      this.localIncompleteTransactionStates.set(userId, {
        isSyncing: false,
        scheduledSync: false,
      });
    }

    const syncState = this.localIncompleteTransactionStates.get(userId)!;
    if (syncState.isSyncing) {
      this.logger.trace(
        `Syncing of local incomplete transactions already in progress for user ${userId}, scheduling sync`
      );
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
      this.logger.trace(
        `Syncing of local incomplete transactions completed for user ${userId}`
      );

      if (syncState.scheduledSync) {
        syncState.scheduledSync = false;
        this.syncLocalIncompleteTransactions(userId);
      }
    }
  }

  public async syncServerTransactions(message: NodeTransactionsBatchMessage) {
    this.logger.trace(`Syncing server transactions for user ${message.userId}`);

    if (this.syncingTransactions.has(message.userId)) {
      this.logger.trace(
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
        this.updateNodeTransactionCursor(message.userId, cursor);
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing server transactions for user ${message.userId}`
      );
    } finally {
      this.logger.trace(
        `Syncing of server transactions completed for user ${message.userId}`
      );

      this.syncingTransactions.delete(message.userId);
      this.requireNodeTransactions(message.userId);
    }
  }

  public async syncServerCollaborations(message: CollaborationsBatchMessage) {
    this.logger.trace(
      `Syncing server collaborations for user ${message.userId}`
    );

    if (this.syncingCollaborations.has(message.userId)) {
      this.logger.trace(
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
    this.logger.trace(`Syncing server revocations for user ${message.userId}`);

    if (this.syncingRevocations.has(message.userId)) {
      this.logger.trace(
        `Syncing of server revocations already in progress for user ${message.userId}, skipping`
      );
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
      this.logger.trace(
        `Syncing of server revocations completed for user ${message.userId}`
      );

      this.syncingRevocations.delete(message.userId);
      this.requireCollaborationRevocations(message.userId);
    }
  }

  public async syncServerInteractions(message: InteractionsBatchMessage) {
    this.logger.trace(`Syncing server interactions for user ${message.userId}`);

    if (this.syncingInteractions.has(message.userId)) {
      this.logger.trace(
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
        this.updateInteractionCursor(message.userId, cursor);
      }
    } catch (error) {
      this.logger.error(
        error,
        `Error syncing server interactions for user ${message.userId}`
      );
    } finally {
      this.logger.trace(
        `Syncing of server interactions completed for user ${message.userId}`
      );

      this.syncingInteractions.delete(message.userId);
      this.requireInteractions(message.userId);
    }
  }

  private async syncIncompleteTransactions(userId: string) {
    this.logger.trace(`Syncing incomplete transactions for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const incompleteTransactions = await workspaceDatabase
      .selectFrom('node_transactions')
      .selectAll()
      .where('status', '=', 'incomplete')
      .execute();

    if (incompleteTransactions.length === 0) {
      this.logger.trace(
        `No incomplete transactions found for user ${userId}, skipping`
      );
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
      this.logger.trace(`No workspace found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      this.logger.trace(
        `Server ${workspace.domain} is not available, skipping`
      );
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
        this.logger.trace(
          `Syncing incomplete transactions for node ${nodeId} for user ${userId}`
        );

        const { data } = await httpClient.get<GetNodeTransactionsOutput>(
          `/v1/nodes/${workspace.workspace_id}/transactions/${nodeId}`,
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

        if (data.transactions.length === 0) {
          this.logger.trace(
            `No transactions found for node ${nodeId} for user ${userId}, deleting`
          );

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
          this.logger.trace(
            `Failed to sync transactions for node ${nodeId} for user ${userId}, incrementing retry count`
          );

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
          this.logger.trace(
            `Successfully synced transactions for node ${nodeId} for user ${userId}, resetting retry count`
          );

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
    this.logger.trace(`Syncing missing nodes for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const missingNodes = await workspaceDatabase
      .selectFrom('collaborations')
      .leftJoin('nodes', 'collaborations.node_id', 'nodes.id')
      .select('collaborations.node_id')
      .where('nodes.id', 'is', null)
      .execute();

    if (missingNodes.length === 0) {
      this.logger.trace(`No missing nodes found for user ${userId}, skipping`);
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
      this.logger.trace(`No workspace found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      this.logger.trace(
        `Server ${workspace.domain} is not available, skipping`
      );
      return;
    }

    for (const node of missingNodes) {
      try {
        this.logger.trace(
          `Syncing missing node ${node.node_id} for user ${userId}`
        );

        const { data } = await httpClient.get<GetNodeTransactionsOutput>(
          `/v1/nodes/${workspace.workspace_id}/transactions/${node.node_id}`,
          {
            domain: workspace.domain,
            token: workspace.token,
          }
        );

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
    this.logger.trace(`Checking for missing node ${nodeId} for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', nodeId)
      .executeTakeFirst();

    if (node) {
      this.logger.trace(`Node ${nodeId} for user ${userId} found, skipping`);
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
      this.logger.trace(`No workspace found for user ${userId}, skipping`);
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      this.logger.trace(
        `Server ${workspace.domain} is not available, skipping`
      );
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
    this.logger.trace(`Sending local pending transactions for user ${userId}`);

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

    this.logger.trace(
      `Sending ${unsyncedTransactions.length} local pending transactions for user ${userId}`
    );

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
      this.logger.trace(
        `No workspace found for user ${userId}, skipping sending local pending transactions`
      );
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      this.logger.trace(
        `Server ${workspace.domain} is not available, skipping sending local pending transactions`
      );
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
      this.logger.trace(
        `Marking ${syncedTransactionIds.length} local pending transactions as sent for user ${userId}`
      );

      await workspaceDatabase
        .updateTable('node_transactions')
        .set({ status: 'sent' })
        .where('id', 'in', syncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }

    if (unsyncedTransactionIds.length > 0) {
      this.logger.trace(
        `Marking ${unsyncedTransactionIds.length} local pending transactions as failed for user ${userId}`
      );

      await workspaceDatabase
        .updateTable('node_transactions')
        .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
        .where('id', 'in', unsyncedTransactionIds)
        .where('status', '=', 'pending')
        .execute();
    }
  }

  private async sendLocalInteractions(userId: string) {
    this.logger.trace(`Sending local pending interactions for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

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
      this.logger.trace(
        `No workspace found for user ${userId}, skipping sending local pending interactions`
      );
      return;
    }

    if (!serverService.isAvailable(workspace.domain)) {
      this.logger.trace(
        `Server ${workspace.domain} is not available, skipping sending local pending interactions`
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
        this.logger.trace(
          `No local pending interactions found for user ${userId}, stopping sync`
        );
        hasMore = false;
        break;
      }

      this.logger.trace(
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
          userId: workspace.user_id,
          events: events.map((e) => ({
            attribute: e.attribute,
            value: e.value,
            createdAt: e.created_at,
          })),
        };

        const sent = socketService.sendMessage(workspace.account_id, message);
        if (sent) {
          sentEventIds.push(...events.map((e) => e.event_id));
        }
      }

      if (sentEventIds.length > 0) {
        this.logger.trace(
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

  private async requireNodeTransactions(userId: string) {
    this.logger.trace(`Requiring node transactions for user ${userId}`);

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
      this.logger.trace(
        `No workspace found for user ${userId}, skipping requiring node transactions`
      );
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
    this.logger.trace(`Requiring collaborations for user ${userId}`);

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
      this.logger.trace(
        `No workspace found for user ${userId}, skipping requiring collaborations`
      );
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
    this.logger.trace(`Requiring collaboration revocations for user ${userId}`);

    const workspaceWithCursor = await databaseService.appDatabase
      .selectFrom('workspaces as w')
      .leftJoin('workspace_cursors as wc', 'w.user_id', 'wc.user_id')
      .select(['w.user_id', 'w.workspace_id', 'w.account_id', 'wc.revocations'])
      .where('w.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspaceWithCursor) {
      this.logger.trace(
        `No workspace found for user ${userId}, skipping requiring collaboration revocations`
      );
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

  private async requireInteractions(userId: string) {
    this.logger.trace(`Requiring interactions for user ${userId}`);

    const workspaceWithCursor = await databaseService.appDatabase
      .selectFrom('workspaces as w')
      .leftJoin('workspace_cursors as wc', 'w.user_id', 'wc.user_id')
      .select([
        'w.user_id',
        'w.workspace_id',
        'w.account_id',
        'wc.interactions',
      ])
      .where('w.user_id', '=', userId)
      .executeTakeFirst();

    if (!workspaceWithCursor) {
      this.logger.trace(
        `No workspace found for user ${userId}, skipping requiring interactions`
      );
      return;
    }

    const message: FetchInteractionsMessage = {
      type: 'fetch_interactions',
      userId: workspaceWithCursor.user_id,
      workspaceId: workspaceWithCursor.workspace_id,
      cursor: workspaceWithCursor.interactions?.toString() ?? '0',
    };

    socketService.sendMessage(workspaceWithCursor.account_id, message);
  }

  private async updateNodeTransactionCursor(userId: string, cursor: bigint) {
    this.logger.trace(
      `Updating node transaction cursor for user ${userId} to ${cursor}`
    );

    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        transactions: cursor,
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
    this.logger.trace(
      `Updating collaboration cursor for user ${userId} to ${cursor}`
    );

    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        collaborations: cursor,
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
    this.logger.trace(
      `Updating collaboration revocation cursor for user ${userId} to ${cursor}`
    );

    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        revocations: cursor,
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

  private async updateInteractionCursor(userId: string, cursor: bigint) {
    this.logger.trace(
      `Updating interaction cursor for user ${userId} to ${cursor}`
    );

    await databaseService.appDatabase
      .insertInto('workspace_cursors')
      .values({
        user_id: userId,
        interactions: cursor,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('user_id').doUpdateSet({
          interactions: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }
}

export const syncService = new SyncService();
