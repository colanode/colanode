import { SocketConnection } from '@/main/services/socket-connection';
import { databaseService } from '@/main/data/database-service';
import { Message } from '@colanode/core';
import { serverService } from './server-service';
import { eventBus } from '@/shared/lib/event-bus';

class SocketService {
  private readonly sockets: Map<string, SocketConnection> = new Map();

  constructor() {
    eventBus.subscribe(async (event) => {
      if (event.type === 'server_availability_changed' && event.isAvailable) {
        this.checkConnections();
      } else if (
        event.type === 'account_created' ||
        event.type === 'account_updated' ||
        event.type === 'account_deleted'
      ) {
        this.checkConnections();
      }
    });
  }

  public sendMessage(accountId: string, message: Message) {
    const connection = this.sockets.get(accountId);
    if (!connection) {
      return;
    }

    connection.sendMessage(message);
  }

  public async checkConnections() {
    const accounts = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('status', '=', 'active')
      .execute();

    // Update accounts map
    for (const account of accounts) {
      if (!serverService.isAvailable(account.server)) {
        continue;
      }

      const socket = this.sockets.get(account.id);
      if (socket) {
        socket.checkConnection();
        continue;
      }

      const synapseUrl = serverService.buildSynapseUrl(account.server);
      const connection = new SocketConnection(synapseUrl, account);
      connection.init();

      this.sockets.set(account.id, connection);
    }

    // Remove logged out or missing accounts
    for (const [accountId, connection] of this.sockets.entries()) {
      const account = accounts.find((acc) => acc.id === accountId);
      if (!account) {
        connection.close();
        this.sockets.delete(accountId);
      }
    }
  }
}

export const socketService = new SocketService();
