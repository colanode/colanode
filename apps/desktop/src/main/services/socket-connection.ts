import { Message } from '@colanode/core';
import { WebSocket } from 'ws';

import { SelectAccount } from '@/main/data/app/schema';
import { createLogger } from '@/main/logger';
import { syncService } from '@/main/services/sync-service';
import { BackoffCalculator } from '@/shared/lib/backoff-calculator';
import { eventBus } from '@/shared/lib/event-bus';

export class SocketConnection {
  private readonly logger = createLogger('socket-connection');

  private readonly synapseUrl: string;
  private readonly account: SelectAccount;
  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  constructor(synapseUrl: string, account: SelectAccount) {
    this.synapseUrl = synapseUrl;
    this.account = account;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;
  }

  public init(): void {
    this.logger.trace(
      `Initializing socket connection for account ${this.account.id}`
    );

    if (this.isConnected()) {
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    this.socket = new WebSocket(this.synapseUrl, {
      headers: {
        authorization: this.account.token,
      },
    });

    this.socket.onmessage = async (event) => {
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
      this.logger.trace(
        `Received message of type ${message.type} for account ${this.account.id}`
      );

      if (message.type === 'node_transactions_batch') {
        syncService.syncServerTransactions(message);
      } else if (message.type === 'collaboration_revocations_batch') {
        syncService.syncServerRevocations(message);
      } else if (message.type === 'collaborations_batch') {
        syncService.syncServerCollaborations(message);
      } else if (message.type === 'interactions_batch') {
        syncService.syncServerInteractions(message);
      }
    };

    this.socket.onopen = () => {
      this.logger.trace(
        `Socket connection for account ${this.account.id} opened`
      );

      this.backoffCalculator.reset();
      eventBus.publish({
        type: 'socket_connection_opened',
        accountId: this.account.id,
      });
    };

    this.socket.onerror = () => {
      this.logger.trace(
        `Socket connection for account ${this.account.id} errored`
      );

      this.backoffCalculator.increaseError();
    };

    this.socket.onclose = () => {
      this.logger.trace(
        `Socket connection for account ${this.account.id} closed`
      );

      this.backoffCalculator.increaseError();
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: Message): boolean {
    if (this.socket && this.isConnected()) {
      this.logger.trace(
        `Sending message of type ${message.type} for account ${this.account.id}`
      );

      this.socket.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  public close(): void {
    if (this.socket) {
      this.logger.trace(
        `Closing socket connection for account ${this.account.id}`
      );

      this.socket.close();
    }
  }

  public checkConnection(): void {
    if (this.isConnected()) {
      return;
    }

    if (this.socket == null || this.socket.readyState === WebSocket.CLOSED) {
      this.init();
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      this.closingCount++;

      if (this.closingCount > 50) {
        this.socket.terminate();
        this.closingCount = 0;
      }
    }
  }
}
