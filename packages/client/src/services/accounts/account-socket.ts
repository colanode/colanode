import WebSocket from 'isomorphic-ws';
import ms from 'ms';

import { BackoffCalculator } from '@colanode/client/lib/backoff-calculator';
import { eventBus } from '@colanode/client/lib/event-bus';
import { EventLoop } from '@colanode/client/lib/event-loop';
import { AccountService } from '@colanode/client/services/accounts/account-service';
import { Message, SocketInitOutput, createDebugger } from '@colanode/core';

const debug = createDebugger('desktop:service:account-socket');

export class AccountSocket {
  private readonly account: AccountService;
  private readonly eventLoop: EventLoop;

  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  private eventSubscriptionId: string;

  constructor(account: AccountService) {
    this.account = account;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;

    this.eventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.checkConnection.bind(this)
    );

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'server.availability.changed' &&
        event.server.domain === this.account.server.domain
      ) {
        this.eventLoop.trigger();
      }
    });
  }

  public async init(): Promise<void> {
    this.eventLoop.start();

    if (!this.account.server.isAvailable) {
      return;
    }

    debug(`Initializing socket connection for account ${this.account.id}`);

    if (this.socket && this.isConnected()) {
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    const response = await this.account.client
      .post('v1/sockets')
      .json<SocketInitOutput>();

    this.socket = new WebSocket(
      `${this.account.server.socketBaseUrl}/v1/sockets/${response.id}`
    );

    this.socket.onmessage = async (event: WebSocket.MessageEvent) => {
      const data: string = event.data.toString();
      const message: Message = JSON.parse(data);

      debug(
        `Received message of type ${message.type} for account ${this.account.id}`
      );

      eventBus.publish({
        type: 'account.connection.message.received',
        accountId: this.account.id,
        message,
      });
    };

    this.socket.onopen = () => {
      debug(`Socket connection for account ${this.account.id} opened`);

      this.backoffCalculator.reset();
      eventBus.publish({
        type: 'account.connection.opened',
        accountId: this.account.id,
      });
    };

    this.socket.onerror = () => {
      debug(`Socket connection for account ${this.account.id} errored`);
      this.backoffCalculator.increaseError();
      eventBus.publish({
        type: 'account.connection.closed',
        accountId: this.account.id,
      });
    };

    this.socket.onclose = () => {
      debug(`Socket connection for account ${this.account.id} closed`);
      this.backoffCalculator.increaseError();
      eventBus.publish({
        type: 'account.connection.closed',
        accountId: this.account.id,
      });
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public send(message: Message): boolean {
    if (this.socket && this.isConnected()) {
      debug(
        `Sending message of type ${message.type} for account ${this.account.id}`
      );

      this.socket.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  public close(): void {
    if (this.socket) {
      debug(`Closing socket connection for account ${this.account.id}`);
      this.socket.close();
      this.socket = null;
    }

    this.eventLoop.stop();
    eventBus.unsubscribe(this.eventSubscriptionId);
  }

  private checkConnection(): void {
    try {
      debug(`Checking connection for account ${this.account.id}`);
      if (!this.account.server.isAvailable) {
        return;
      }

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
    } catch (error) {
      debug(
        `Error checking connection for account ${this.account.id}: ${error}`
      );
    }
  }
}
