import { database } from '@/data/database';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/tokens';
import {
  CollaborationsBatchMessage,
  Message,
  NodeTransactionsBatchMessage,
} from '@colanode/core';
import { logService } from '@/services/log';
import { mapCollaboration, mapNodeTransaction } from '@/lib/nodes';
import { eventBus } from '@/lib/event-bus';
import {
  CollaborationCreatedEvent,
  CollaborationUpdatedEvent,
  NodeTransactionCreatedEvent,
} from '@/types/events';

interface SynapseUserCursor {
  workspaceId: string;
  userId: string;
  cursor: string | null;
  syncing: boolean;
}

interface SynapseConnection {
  accountId: string;
  deviceId: string;
  socket: WebSocket;
  nodeTransactions: Map<string, SynapseUserCursor>;
  collaborations: Map<string, SynapseUserCursor>;
}

class SynapseService {
  private readonly logger = logService.createLogger('synapse-service');
  private readonly connections: Map<string, SynapseConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'node_transaction_created') {
        this.handleNodeTransactionCreatedEvent(event);
      } else if (event.type === 'collaboration_created') {
        this.handleCollaborationCreatedEvent(event);
      } else if (event.type === 'collaboration_updated') {
        this.handleCollaborationUpdatedEvent(event);
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
        nodeTransactions: new Map(),
        collaborations: new Map(),
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
      const state = connection.nodeTransactions.get(message.userId);
      if (!state) {
        connection.nodeTransactions.set(message.userId, {
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
    }
  }

  private async sendPendingTransactions(
    connection: SynapseConnection,
    userId: string
  ) {
    const state = connection.nodeTransactions.get(userId);
    if (!state || state.syncing) {
      return;
    }

    state.syncing = true;
    this.logger.trace(
      state,
      `Sending pending node transactions for ${connection.deviceId} with ${userId}`
    );

    let query = database
      .selectFrom('node_transactions as nt')
      .innerJoin('collaborations as c', (join) =>
        join.on('c.user_id', '=', userId).onRef('c.node_id', '=', 'nt.node_id')
      )
      .selectAll('nt');

    if (state.cursor) {
      query = query.where('nt.number', '>', BigInt(state.cursor));
    }

    const unsyncedTransactions = await query
      .orderBy('nt.number', 'asc')
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

    connection.nodeTransactions.delete(userId);
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

    let query = database
      .selectFrom('collaborations as c')
      .selectAll()
      .where('c.user_id', '=', userId);

    if (state.cursor) {
      query = query.where('c.number', '>', BigInt(state.cursor));
    }

    const unsyncedCollaborations = await query
      .orderBy('c.number', 'asc')
      .limit(20)
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

  private async handleNodeTransactionCreatedEvent(
    event: NodeTransactionCreatedEvent
  ) {
    const userDevices = this.getPendingNodeTransactionCursors(
      event.workspaceId
    );
    const userIds = Array.from(userDevices.keys());
    if (userIds.length === 0) {
      return;
    }

    const collaborations = await database
      .selectFrom('collaborations')
      .selectAll()
      .where((eb) =>
        eb.and([eb('user_id', 'in', userIds), eb('node_id', '=', event.nodeId)])
      )
      .execute();

    if (collaborations.length === 0) {
      return;
    }

    for (const collaboration of collaborations) {
      const deviceIds = userDevices.get(collaboration.user_id) ?? [];
      for (const deviceId of deviceIds) {
        const socketConnection = this.connections.get(deviceId);
        if (socketConnection === undefined) {
          continue;
        }

        this.sendPendingTransactions(socketConnection, collaboration.user_id);
      }
    }
  }

  private handleCollaborationCreatedEvent(event: CollaborationCreatedEvent) {
    const userDevices = this.getPendingCollaborationCursors(event.userId);
    if (userDevices.length === 0) {
      return;
    }

    for (const deviceId of userDevices) {
      const socketConnection = this.connections.get(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      this.sendPendingCollaborations(socketConnection, event.userId);
    }
  }

  private handleCollaborationUpdatedEvent(event: CollaborationUpdatedEvent) {
    const userDevices = this.getPendingCollaborationCursors(event.userId);
    if (userDevices.length === 0) {
      return;
    }

    for (const deviceId of userDevices) {
      const socketConnection = this.connections.get(deviceId);
      if (socketConnection === undefined) {
        continue;
      }

      this.sendPendingCollaborations(socketConnection, event.userId);
    }
  }

  private getPendingNodeTransactionCursors(
    workspaceId: string
  ): Map<string, string[]> {
    const userDevices = new Map<string, string[]>();
    for (const connection of this.connections.values()) {
      const connectionUsers = connection.nodeTransactions.values();
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

  private getPendingCollaborationCursors(userId: string): string[] {
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
}

export const synapse = new SynapseService();
