import { WebSocket } from 'ws';
import {
  CollaborationsBatchMessage,
  InitSyncConsumerMessage,
  InteractionsBatchMessage,
  Message,
  TransactionsBatchMessage,
  NodeType,
  SyncConsumerType,
  WorkspaceStatus,
  DeletedCollaborationsBatchMessage,
} from '@colanode/core';

import { interactionService } from '@/services/interaction-service';
import { createLogger } from '@/lib/logger';
import { RequestAccount } from '@/types/api';
import { database } from '@/data/database';
import {
  mapCollaboration,
  mapDeletedCollaboration,
  mapInteraction,
  mapTransaction,
} from '@/lib/nodes';
import {
  CollaboratorAddedEvent,
  CollaboratorRemovedEvent,
  Event,
  InteractionUpdatedEvent,
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
} from '@/types/events';

const PUBLIC_NODES: NodeType[] = ['workspace', 'user'];

type SocketSyncConsumer = {
  type: SyncConsumerType;
  cursor: string;
  fetching: boolean;
};

type SocketUser = {
  userId: string;
  workspaceId: string;
  consumers: Map<SyncConsumerType, SocketSyncConsumer>;
};

export class SocketConnection {
  private readonly logger = createLogger('socket-connection');
  private readonly account: RequestAccount;
  private readonly socket: WebSocket;

  private readonly users: Map<string, SocketUser> = new Map();

  constructor(account: RequestAccount, socket: WebSocket) {
    this.account = account;
    this.socket = socket;

    this.socket.on('message', (data) => {
      const message = JSON.parse(data.toString()) as Message;
      this.handleMessage(message);
    });
  }

  public getDeviceId() {
    return this.account.deviceId;
  }

  public getAccountId() {
    return this.account.id;
  }

  public sendMessage(message: Message) {
    this.socket.send(JSON.stringify(message));
  }

  public handleEvent(event: Event) {
    if (event.type === 'node_created') {
      this.handleNodeCreatedEvent(event);
    } else if (event.type === 'node_updated') {
      this.handleNodeUpdatedEvent(event);
    } else if (event.type === 'node_deleted') {
      this.handleNodeDeletedEvent(event);
    } else if (event.type === 'collaborator_added') {
      this.handleCollaboratorAddedEvent(event);
    } else if (event.type === 'collaborator_removed') {
      this.handleCollaboratorRemovedEvent(event);
    } else if (event.type === 'interaction_updated') {
      this.handleInteractionUpdatedEvent(event);
    }
  }

  private async handleMessage(message: Message) {
    this.logger.trace(message, `Socket message from ${this.account.id}`);

    if (message.type === 'init_sync_consumer') {
      this.handleInitSyncConsumer(message);
    } else if (message.type === 'sync_interactions') {
      interactionService.syncLocalInteractions(this.account.id, message);
    }
  }

  private async handleInitSyncConsumer(message: InitSyncConsumerMessage) {
    this.logger.info(
      `Init sync consumer from ${this.account.id} for ${message.consumerType}`
    );

    const user = await this.getOrCreateUser(message.userId);
    if (user === null) {
      return;
    }

    const consumer = user.consumers.get(message.consumerType);
    if (!consumer) {
      const newConsumer: SocketSyncConsumer = {
        type: message.consumerType,
        cursor: message.cursor,
        fetching: false,
      };
      user.consumers.set(message.consumerType, newConsumer);
      this.consumePendingSync(user, newConsumer);
    } else if (!consumer.fetching && consumer.cursor !== message.cursor) {
      consumer.cursor = message.cursor;
      this.consumePendingSync(user, consumer);
    }
  }

  private async consumePendingSync(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.type === 'transactions') {
      this.consumeTransactions(user, consumer);
    } else if (consumer.type === 'deleted_collaborations') {
      this.consumeDeletedCollaborations(user, consumer);
    } else if (consumer.type === 'collaborations') {
      this.consumeCollaborations(user, consumer);
    } else if (consumer.type === 'interactions') {
      this.consumeInteractions(user, consumer);
    }
  }

  private async consumeTransactions(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      `Sending pending node transactions for ${this.account.id} with ${consumer.type}`
    );

    const unsyncedTransactions = await database
      .selectFrom('transactions as t')
      .leftJoin('collaborations as c', (join) =>
        join
          .on('c.user_id', '=', user.userId)
          .onRef('c.node_id', '=', 't.node_id')
      )
      .selectAll('t')
      .where((eb) =>
        eb.or([
          eb.and([
            eb('t.workspace_id', '=', user.workspaceId),
            eb('t.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('t.node_id')),
        ])
      )
      .where('t.version', '>', BigInt(consumer.cursor))
      .orderBy('t.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      consumer.fetching = false;
      return;
    }

    const transactions = unsyncedTransactions.map(mapTransaction);
    const message: TransactionsBatchMessage = {
      type: 'transactions_batch',
      userId: user.userId,
      transactions,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeDeletedCollaborations(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      consumer,
      `Sending pending deleted collaborations for ${this.account.id} with ${consumer.type}`
    );

    const unsyncedDeletedCollaborations = await database
      .selectFrom('deleted_collaborations as dc')
      .selectAll()
      .where('dc.user_id', '=', user.userId)
      .where('dc.version', '>', BigInt(consumer.cursor))
      .orderBy('dc.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedDeletedCollaborations.length === 0) {
      consumer.fetching = false;
      return;
    }

    const deletedCollaborations = unsyncedDeletedCollaborations.map(
      mapDeletedCollaboration
    );
    const message: DeletedCollaborationsBatchMessage = {
      type: 'deleted_collaborations_batch',
      userId: user.userId,
      deletedCollaborations,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeCollaborations(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      consumer,
      `Sending pending collaborations for ${this.account.id} with ${consumer.type}`
    );

    const unsyncedCollaborations = await database
      .selectFrom('collaborations as c')
      .selectAll()
      .where('c.user_id', '=', user.userId)
      .where('c.version', '>', BigInt(consumer.cursor))
      .orderBy('c.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedCollaborations.length === 0) {
      consumer.fetching = false;
      return;
    }

    const collaborations = unsyncedCollaborations.map(mapCollaboration);
    const message: CollaborationsBatchMessage = {
      type: 'collaborations_batch',
      userId: user.userId,
      collaborations,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async consumeInteractions(
    user: SocketUser,
    consumer: SocketSyncConsumer
  ) {
    if (consumer.fetching) {
      return;
    }

    consumer.fetching = true;
    this.logger.trace(
      consumer,
      `Sending pending interactions for ${this.account.id} with ${consumer.type}`
    );

    const unsyncedInteractions = await database
      .selectFrom('interactions as i')
      .leftJoin('collaborations as c', (join) =>
        join
          .on('c.user_id', '=', user.userId)
          .onRef('c.node_id', '=', 'i.node_id')
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb('i.workspace_id', '=', user.workspaceId),
            eb('i.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('i.node_id')),
        ])
      )
      .selectAll('i')
      .where('i.version', '>', BigInt(consumer.cursor))
      .orderBy('i.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedInteractions.length === 0) {
      consumer.fetching = false;
      return;
    }

    const interactions = unsyncedInteractions.map(mapInteraction);
    const message: InteractionsBatchMessage = {
      type: 'interactions_batch',
      userId: user.userId,
      interactions,
    };

    user.consumers.delete(consumer.type);
    this.sendMessage(message);
  }

  private async handleNodeCreatedEvent(event: NodeCreatedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }

      const collaborationsConsumer = user.consumers.get('collaborations');
      if (collaborationsConsumer) {
        this.consumePendingSync(user, collaborationsConsumer);
      }

      const interactionsConsumer = user.consumers.get('interactions');
      if (interactionsConsumer) {
        this.consumePendingSync(user, interactionsConsumer);
      }
    }
  }

  private async handleNodeUpdatedEvent(event: NodeUpdatedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }
    }
  }

  private async handleNodeDeletedEvent(event: NodeDeletedEvent) {
    for (const user of this.users.values()) {
      if (user.workspaceId !== event.workspaceId) {
        continue;
      }

      const transactionsConsumer = user.consumers.get('transactions');
      if (transactionsConsumer) {
        this.consumePendingSync(user, transactionsConsumer);
      }

      const deletedCollaborationsConsumer = user.consumers.get(
        'deleted_collaborations'
      );
      if (deletedCollaborationsConsumer) {
        this.consumePendingSync(user, deletedCollaborationsConsumer);
      }
    }
  }

  private async handleCollaboratorAddedEvent(event: CollaboratorAddedEvent) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const collaborationsConsumer = user.consumers.get('collaborations');
      if (collaborationsConsumer) {
        this.consumePendingSync(user, collaborationsConsumer);
      }
    }
  }

  private async handleCollaboratorRemovedEvent(
    event: CollaboratorRemovedEvent
  ) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const deletedCollaborationsConsumer = user.consumers.get(
        'deleted_collaborations'
      );
      if (deletedCollaborationsConsumer) {
        this.consumePendingSync(user, deletedCollaborationsConsumer);
      }
    }
  }

  private async handleInteractionUpdatedEvent(event: InteractionUpdatedEvent) {
    for (const user of this.users.values()) {
      if (user.userId !== event.userId) {
        continue;
      }

      const interactionsConsumer = user.consumers.get('interactions');
      if (interactionsConsumer) {
        this.consumePendingSync(user, interactionsConsumer);
      }
    }
  }

  private async getOrCreateUser(userId: string): Promise<SocketUser | null> {
    const socketUser = this.users.get(userId);
    if (socketUser) {
      return socketUser;
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirst();

    if (!workspaceUser) {
      return null;
    }

    if (workspaceUser.status !== WorkspaceStatus.Active) {
      return null;
    }

    if (workspaceUser.account_id !== this.account.id) {
      return null;
    }

    const newSocketUser: SocketUser = {
      userId,
      workspaceId: workspaceUser.workspace_id,
      consumers: new Map(),
    };

    this.users.set(userId, newSocketUser);
    return newSocketUser;
  }
}