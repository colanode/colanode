import { WebSocket } from 'ws';

import { generateId, IdType } from '@colanode/core';
import { redis } from '@colanode/server/data/redis';
import { eventBus } from '@colanode/server/lib/event-bus';
import { SocketConnection } from '@colanode/server/services/socket-connection';
import { ClientContext, RequestAccount } from '@colanode/server/types/api';
import { SocketContext } from '@colanode/server/types/sockets';

class SocketService {
  private readonly connections: Map<string, SocketConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'device.deleted') {
        const connection = this.connections.get(event.deviceId);
        if (connection) {
          connection.close();
          this.connections.delete(event.deviceId);
        }

        return;
      }

      for (const connection of this.connections.values()) {
        connection.handleEvent(event);
      }
    });
  }

  public async initSocket(account: RequestAccount, client: ClientContext) {
    const id = generateId(IdType.Socket);
    const context: SocketContext = {
      id,
      accountId: account.id,
      deviceId: account.deviceId,
      client,
    };

    await redis.set(id, JSON.stringify(context), {
      expiration: {
        type: 'EX',
        value: 60,
      },
    });

    return id;
  }

  public async addConnection(id: string, socket: WebSocket): Promise<boolean> {
    const context = await this.fetchSocketContext(id);
    if (!context) {
      return false;
    }

    const existingConnection = this.connections.get(context.deviceId);
    if (existingConnection) {
      existingConnection.close();
      this.connections.delete(context.deviceId);
    }

    const connection = new SocketConnection(context, socket, () =>
      this.connections.delete(context.deviceId)
    );
    this.connections.set(context.deviceId, connection);

    return true;
  }

  private async fetchSocketContext(id: string): Promise<SocketContext | null> {
    const data = await redis.get(id);
    if (!data) {
      return null;
    }

    await redis.del(id);
    return JSON.parse(data);
  }
}

export const socketService = new SocketService();
