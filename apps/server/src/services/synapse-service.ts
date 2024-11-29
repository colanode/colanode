import { database } from '@/data/database';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/tokens';
import {
  InteractionsBatchMessage,
  CollaborationRevocationsBatchMessage,
  CollaborationsBatchMessage,
  Message,
  NodeTransactionsBatchMessage,
  NodeType,
} from '@colanode/core';
import { logService } from '@/services/log-service';
import { interactionService } from '@/services/interaction-service';
import {
  mapInteraction,
  mapCollaboration,
  mapCollaborationRevocation,
  mapNodeTransaction,
} from '@/lib/nodes';
import { eventBus } from '@/lib/event-bus';
import {
  CollaboratorRemovedEvent,
  InteractionUpdatedEvent,
  NodeCreatedEvent,
  NodeUpdatedEvent,
  NodeDeletedEvent,
  CollaboratorAddedEvent,
} from '@/types/events';

interface SynapseUserCursor {
  workspaceId: string;
  userId: string;
  cursor: string;
  syncing: boolean;
}

interface SynapseConnection {
  accountId: string;
  deviceId: string;
  socket: WebSocket;
  transactions: Map<string, SynapseUserCursor>;
  revocations: Map<string, SynapseUserCursor>;
  collaborations: Map<string, SynapseUserCursor>;
  interactions: Map<string, SynapseUserCursor>;
}

const PUBLIC_NODES: NodeType[] = ['workspace', 'user'];

class SynapseService {
  private readonly logger = logService.createLogger('synapse-service');
  private readonly connections: Map<string, SynapseConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
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
    });
  }

  public async init(server: Server) {
    this.logger.info('Initializing synapse service');

    const wss = new WebSocketServer({
      server,
      path: '/v1/synapse',
      verifyClient: async (info, callback) => {
        const req = info.req;
        const token = req.headers['authorization'];

        if (!token) {
          return callback(false, 401, 'Unauthorized');
        }

        callback(true);
      },
    });

    wss.on('connection', async (socket, req) => {
      let verified = false;
      const messageBuffer: Message[] = [];
      socket.onmessage = async (event) => {
        let data: string;

        if (typeof event.data === 'string') {
          data = event.data;
        } else if (event.data instanceof ArrayBuffer) {
          data = new TextDecoder().decode(event.data);
        } else {
          console.error('Unsupported message data type:', typeof event.data);
          return;
        }

        const message: Message = JSON.parse(data);
        if (!verified) {
          messageBuffer.push(message);
        } else {
          this.handleSocketMessage(connection, message);
        }
      };

      const token = req.headers['authorization'];
      if (!token) {
        socket.close();
        return;
      }

      const result = await verifyToken(token);
      if (!result.authenticated) {
        socket.close();
        return;
      }

      const account = result.account;
      this.logger.info(`New synapse connection from ${account.id}`);

      socket.onclose = () => {
        const connection = this.connections.get(account.deviceId);
        if (connection) {
          this.connections.delete(account.deviceId);
        }
      };

      const connection: SynapseConnection = {
        accountId: account.id,
        deviceId: account.deviceId,
        socket,
        transactions: new Map(),
        revocations: new Map(),
        collaborations: new Map(),
        interactions: new Map(),
      };

      this.connections.set(account.deviceId, connection);

      verified = true;
      for (const message of messageBuffer) {
        this.handleSocketMessage(connection, message);
      }
      messageBuffer.splice(0, messageBuffer.length);
    });
  }

  private sendMessage(connection: SynapseConnection, message: Message) {
    connection.socket.send(JSON.stringify(message));
  }

  private async handleSocketMessage(
    connection: SynapseConnection,
    message: Message
  ) {
    this.logger.trace(message, `Socket message from ${connection.deviceId}`);

    if (message.type === 'fetch_node_transactions') {
      const state = connection.transactions.get(message.userId);
      if (!state) {
        connection.transactions.set(message.userId, {
          userId: message.userId,
          workspaceId: message.workspaceId,
          cursor: message.cursor,
          syncing: false,
        });

        this.sendPendingTransactions(connection, message.userId);
      } else if (!state.syncing && state.cursor !== message.cursor) {
        state.cursor = message.cursor;
        this.sendPendingTransactions(connection, message.userId);
      }
    } else if (message.type === 'fetch_collaboration_revocations') {
      const state = connection.revocations.get(message.userId);
      if (!state) {
        connection.revocations.set(message.userId, {
          userId: message.userId,
          workspaceId: message.workspaceId,
          cursor: message.cursor,
          syncing: false,
        });

        this.sendPendingRevocations(connection, message.userId);
      } else if (!state.syncing && state.cursor !== message.cursor) {
        state.cursor = message.cursor;
        this.sendPendingRevocations(connection, message.userId);
      }
    } else if (message.type === 'fetch_collaborations') {
      const state = connection.collaborations.get(message.userId);
      if (!state) {
        connection.collaborations.set(message.userId, {
          userId: message.userId,
          workspaceId: message.workspaceId,
          cursor: message.cursor,
          syncing: false,
        });

        this.sendPendingCollaborations(connection, message.userId);
      } else if (!state.syncing && state.cursor !== message.cursor) {
        state.cursor = message.cursor;
        this.sendPendingCollaborations(connection, message.userId);
      }
    } else if (message.type === 'fetch_interactions') {
      const state = connection.interactions.get(message.userId);
      if (!state) {
        connection.interactions.set(message.userId, {
          userId: message.userId,
          workspaceId: message.workspaceId,
          cursor: message.cursor,
          syncing: false,
        });

        this.sendPendingInteractions(connection, message.userId);
      } else if (!state.syncing && state.cursor !== message.cursor) {
        state.cursor = message.cursor;
        this.sendPendingInteractions(connection, message.userId);
      }
    } else if (message.type === 'sync_interactions') {
      interactionService.syncLocalInteractions(connection.accountId, message);
    }
  }

  private async sendPendingTransactions(
    connection: SynapseConnection,
    userId: string
  ) {
    const state = connection.transactions.get(userId);
    if (!state || state.syncing) {
      return;
    }

    state.syncing = true;
    this.logger.trace(
      state,
      `Sending pending node transactions for ${connection.deviceId} with ${userId}`
    );

    const unsyncedTransactions = await database
      .selectFrom('node_transactions as nt')
      .leftJoin('collaborations as c', (join) =>
        join.on('c.user_id', '=', userId).onRef('c.node_id', '=', 'nt.node_id')
      )
      .selectAll('nt')
      .where((eb) =>
        eb.or([
          eb.and([
            eb('nt.workspace_id', '=', state.workspaceId),
            eb('nt.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('nt.node_id')),
        ])
      )
      .where('nt.version', '>', BigInt(state.cursor))
      .orderBy('nt.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedTransactions.length === 0) {
      state.syncing = false;
      return;
    }

    const transactions = unsyncedTransactions.map(mapNodeTransaction);
    const message: NodeTransactionsBatchMessage = {
      type: 'node_transactions_batch',
      userId,
      transactions,
    };

    connection.transactions.delete(userId);
    this.sendMessage(connection, message);
  }

  private async sendPendingRevocations(
    connection: SynapseConnection,
    userId: string
  ) {
    const state = connection.revocations.get(userId);
    if (!state || state.syncing) {
      return;
    }

    state.syncing = true;
    this.logger.trace(
      state,
      `Sending pending collaboration revocations for ${connection.deviceId} with ${userId}`
    );

    const unsyncedRevocations = await database
      .selectFrom('collaboration_revocations as cr')
      .selectAll()
      .where('cr.user_id', '=', userId)
      .where('cr.version', '>', BigInt(state.cursor))
      .orderBy('cr.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedRevocations.length === 0) {
      state.syncing = false;
      return;
    }

    const revocations = unsyncedRevocations.map(mapCollaborationRevocation);
    const message: CollaborationRevocationsBatchMessage = {
      type: 'collaboration_revocations_batch',
      userId,
      revocations,
    };

    connection.revocations.delete(userId);
    this.sendMessage(connection, message);
  }

  private async sendPendingCollaborations(
    connection: SynapseConnection,
    userId: string
  ) {
    const state = connection.collaborations.get(userId);
    if (!state || state.syncing) {
      return;
    }

    state.syncing = true;
    this.logger.trace(
      state,
      `Sending pending collaborations for ${connection.deviceId} with ${userId}`
    );

    const unsyncedCollaborations = await database
      .selectFrom('collaborations as c')
      .selectAll()
      .where('c.user_id', '=', userId)
      .where('c.version', '>', BigInt(state.cursor))
      .orderBy('c.version', 'asc')
      .limit(50)
      .execute();

    if (unsyncedCollaborations.length === 0) {
      state.syncing = false;
      return;
    }

    const collaborations = unsyncedCollaborations.map(mapCollaboration);
    const message: CollaborationsBatchMessage = {
      type: 'collaborations_batch',
      userId,
      collaborations,
    };

    connection.collaborations.delete(userId);
    this.sendMessage(connection, message);
  }

  private async sendPendingInteractions(
    connection: SynapseConnection,
    userId: string
  ) {
    const state = connection.interactions.get(userId);
    if (!state || state.syncing) {
      return;
    }

    state.syncing = true;
    this.logger.trace(
      state,
      `Sending pending interactions for ${connection.deviceId} with ${userId}`
    );

    const unsyncedInteractions = await database
      .selectFrom('interactions as i')
      .leftJoin('collaborations as c', (join) =>
        join.on('c.user_id', '=', userId).onRef('c.node_id', '=', 'i.node_id')
      )
      .where((eb) =>
        eb.or([
          eb.and([
            eb('i.workspace_id', '=', state.workspaceId),
            eb('i.node_type', 'in', PUBLIC_NODES),
          ]),
          eb('c.node_id', '=', eb.ref('i.node_id')),
        ])
      )
      .selectAll('i')
      .where('i.version', '>', BigInt(state.cursor))
      .orderBy('i.version', 'asc')
      .limit(20)
      .execute();

    if (unsyncedInteractions.length === 0) {
      state.syncing = false;
      return;
    }

    const interactions = unsyncedInteractions.map(mapInteraction);
    const message: InteractionsBatchMessage = {
      type: 'interactions_batch',
      userId,
      interactions,
    };

    connection.interactions.delete(userId);
    this.sendMessage(connection, message);
  }

  private async handleNodeCreatedEvent(event: NodeCreatedEvent) {
    const userDevices = this.getPendingNodeTransactionCursors(
      event.workspaceId
    );
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    let usersToSend: string[] = [];
    if (PUBLIC_NODES.includes(event.nodeType)) {
      usersToSend = userIds;
    } else {
      const collaborations = await database
        .selectFrom('collaborations')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('user_id', 'in', userIds),
            eb('node_id', '=', event.nodeId),
          ])
        )
        .execute();

      usersToSend = collaborations.map((c) => c.user_id);
    }

    if (usersToSend.length === 0) {
      return;
    }

    for (const userId of usersToSend) {
      const deviceIds = userDevices.get(userId) ?? [];
      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        this.sendPendingTransactions(socketConnection, userId);
        this.sendPendingCollaborations(socketConnection, userId);
      }
    }
  }

  private async handleNodeUpdatedEvent(event: NodeUpdatedEvent) {
    const userDevices = this.getPendingNodeTransactionCursors(
      event.workspaceId
    );
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    let usersToSend: string[] = [];
    if (PUBLIC_NODES.includes(event.nodeType)) {
      usersToSend = userIds;
    } else {
      const collaborations = await database
        .selectFrom('collaborations')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('user_id', 'in', userIds),
            eb('node_id', '=', event.nodeId),
          ])
        )
        .execute();

      usersToSend = collaborations.map((c) => c.user_id);
    }

    if (usersToSend.length === 0) {
      return;
    }

    for (const userId of usersToSend) {
      const deviceIds = userDevices.get(userId) ?? [];
      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        this.sendPendingTransactions(socketConnection, userId);
      }
    }
  }

  private async handleNodeDeletedEvent(event: NodeDeletedEvent) {
    const userDevices = this.getPendingNodeTransactionCursors(
      event.workspaceId
    );
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    let usersToSend: string[] = [];
    if (PUBLIC_NODES.includes(event.nodeType)) {
      usersToSend = userIds;
    } else {
      const collaborations = await database
        .selectFrom('collaborations')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('user_id', 'in', userIds),
            eb('node_id', '=', event.nodeId),
          ])
        )
        .execute();

      usersToSend = collaborations.map((c) => c.user_id);
    }

    if (usersToSend.length === 0) {
      return;
    }

    for (const userId of usersToSend) {
      const deviceIds = userDevices.get(userId) ?? [];
      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        this.sendPendingTransactions(socketConnection, userId);
      }
    }
  }

  private async handleInteractionUpdatedEvent(event: InteractionUpdatedEvent) {
    const userDevices = this.getPendingInteractionsCursors(event.workspaceId);
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    let usersToSend: string[] = [];
    if (PUBLIC_NODES.includes(event.nodeType)) {
      usersToSend = userIds;
    } else {
      const collaborations = await database
        .selectFrom('collaborations')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('user_id', 'in', userIds),
            eb('node_id', '=', event.nodeId),
          ])
        )
        .execute();

      usersToSend = collaborations.map((c) => c.user_id);
    }

    for (const userId of usersToSend) {
      const deviceIds = userDevices.get(userId) ?? [];
      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        this.sendPendingTransactions(socketConnection, userId);
      }
    }
  }

  private handleCollaboratorAddedEvent(event: CollaboratorAddedEvent) {
    const deviceIds = this.getPendingCollaborationsCursors(event.userId);
    for (const deviceId of deviceIds) {
      const socketConnection = this.connections.get(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      this.sendPendingCollaborations(socketConnection, event.userId);
    }
  }

  private handleCollaboratorRemovedEvent(event: CollaboratorRemovedEvent) {
    const deviceIds = this.getPendingRevocationsCursors(event.userId);
    for (const deviceId of deviceIds) {
      const socketConnection = this.connections.get(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      this.sendPendingRevocations(socketConnection, event.userId);
    }
  }

  private getPendingNodeTransactionCursors(
    workspaceId: string
  ): Map<string, string[]> {
    const userDevices = new Map<string, string[]>();
    for (const connection of this.connections.values()) {
      const connectionUsers = connection.transactions.values();
      for (const user of connectionUsers) {
        if (user.workspaceId !== workspaceId || user.syncing) {
          continue;
        }

        const userIds = userDevices.get(user.userId) ?? [];
        userIds.push(connection.deviceId);
        userDevices.set(user.userId, userIds);
      }
    }

    return userDevices;
  }

  private getPendingInteractionsCursors(
    workspaceId: string
  ): Map<string, string[]> {
    const userDevices = new Map<string, string[]>();
    for (const connection of this.connections.values()) {
      const connectionUsers = connection.interactions.values();
      for (const user of connectionUsers) {
        if (user.workspaceId !== workspaceId || user.syncing) {
          continue;
        }

        const userIds = userDevices.get(user.userId) ?? [];
        userIds.push(connection.deviceId);
        userDevices.set(user.userId, userIds);
      }
    }

    return userDevices;
  }

  private getPendingCollaborationsCursors(userId: string): string[] {
    const userDevices: string[] = [];
    for (const connection of this.connections.values()) {
      const connectionUsers = connection.collaborations.values();
      for (const user of connectionUsers) {
        if (user.userId !== userId || user.syncing) {
          continue;
        }

        userDevices.push(connection.deviceId);
      }
    }

    return userDevices;
  }

  private getPendingRevocationsCursors(userId: string): string[] {
    const userDevices: string[] = [];
    for (const connection of this.connections.values()) {
      const connectionUsers = connection.revocations.values();
      for (const user of connectionUsers) {
        if (user.userId !== userId || user.syncing) {
          continue;
        }

        userDevices.push(connection.deviceId);
      }
    }

    return userDevices;
  }
}

export const synapse = new SynapseService();
