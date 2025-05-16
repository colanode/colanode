import { Message, createDebugger } from '@colanode/core';
import WebSocket from 'isomorphic-ws';
import ms from 'ms';

import { AccountService } from './account-service';

import { BackoffCalculator } from '../../lib/backoff-calculator';
import { EventLoop } from '../../lib/event-loop';
import { eventBus } from '../../lib/event-bus';

const debug = createDebugger('desktop:service:account-connection');

export class AccountConnection {
  private readonly account: AccountService;
  private readonly eventLoop: EventLoop;

  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  private eventSubscriptionId: string;

  constructor(accountService: AccountService) {
    this.account = accountService;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;

    this.eventLoop = new EventLoop(ms('1 minute'), ms('1 second'), () => {
      this.checkConnection();
    });

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'server_availability_changed' &&
        event.server.domain === this.account.server.domain
      ) {
        this.eventLoop.trigger();
      }
    });
  }

  public init(): void {
    this.eventLoop.start();

    if (!this.account.server.isAvailable) {
      return;
    }

    debug(`Initializing socket connection for account ${this.account.id}`);

    if (this.socket && this.isConnected()) {
      this.socket.ping();
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    const url = `${this.account.server.synapseUrl}?token=${this.account.token}`;
    this.socket = new WebSocket(url);

    this.socket.onmessage = async (event) => {
      const data: string = event.data.toString();
      const message: Message = JSON.parse(data);

      debug(
        `Received message of type ${message.type} for account ${this.account.id}`
      );

      eventBus.publish({
        type: 'account_connection_message',
        accountId: this.account.id,
        message,
      });
    };

    this.socket.onopen = () => {
      debug(`Socket connection for account ${this.account.id} opened`);

      this.backoffCalculator.reset();
      eventBus.publish({
        type: 'account_connection_opened',
        accountId: this.account.id,
      });
    };

    this.socket.onerror = () => {
      debug(`Socket connection for account ${this.account.id} errored`);
      this.backoffCalculator.increaseError();
      eventBus.publish({
        type: 'account_connection_closed',
        accountId: this.account.id,
      });
    };

    this.socket.onclose = () => {
      debug(`Socket connection for account ${this.account.id} closed`);
      this.backoffCalculator.increaseError();
      eventBus.publish({
        type: 'account_connection_closed',
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
    debug(`Checking connection for account ${this.account.id}`);
    if (!this.account.server.isAvailable) {
      return;
    }

    if (this.isConnected()) {
      this.socket?.ping();
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
