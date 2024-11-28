import { database } from '@/data/database';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/tokens';
import {
  CollaborationRevocationsBatchMessage,
  Message,
  NodeTransactionsBatchMessage,
} from '@colanode/core';
import { logService } from '@/services/log-service';
import { mapCollaborationRevocation, mapNodeTransaction } from '@/lib/nodes';
import { eventBus } from '@/lib/event-bus';
import { NodeTransactionCreatedEvent } from '@/types/events';

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
}

class SynapseService {
  private readonly logger = logService.createLogger('synapse-service');
  private readonly connections: Map<string, SynapseConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'node_transaction_created') {
        this.handleNodeTransactionCreatedEvent(event);
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
            eb('nt.node_type', 'in', ['workspace', 'user']),
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

  private getPendingCollaborationCursors(userId: string): string[] {
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
