import { WebSocket } from 'ws';

import { SocketConnection } from '@/services/socket-connection';
import { eventBus } from '@/lib/event-bus';
import { RequestAccount } from '@/types/api';

class SocketService {
  private readonly connections: Map<string, SocketConnection> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      if (event.type === 'device_deleted') {
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

  public addConnection(account: RequestAccount, socket: WebSocket) {
    const existingConnection = this.connections.get(account.deviceId);
    if (existingConnection) {
      existingConnection.close();
      this.connections.delete(account.deviceId);
    }

    const connection = new SocketConnection(account, socket);
    this.connections.set(account.deviceId, connection);
  }
}

export const socketService = new SocketService();
