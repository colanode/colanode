import { sha256 } from 'js-sha256';
import ms from 'ms';

import { eventBus } from '@colanode/client/lib/event-bus';
import { EventLoop } from '@colanode/client/lib/event-loop';
import { AccountSocket } from '@colanode/client/services/accounts/account-socket';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
  SynchronizerOutputMessage,
  SynchronizerInputMessage,
  SynchronizerInput,
  SynchronizerMap,
  createDebugger,
  Message,
} from '@colanode/core';

export type SynchronizerStatus = 'idle' | 'waiting' | 'processing';

const debug = createDebugger('desktop:synchronizer');

export class Synchronizer<TInput extends SynchronizerInput> {
  private readonly id: string;
  private readonly input: TInput;
  private readonly workspace: WorkspaceService;
  private readonly connection: AccountSocket;
  private readonly cursorKey: string;
  private readonly eventLoop: EventLoop;
  private readonly eventSubscriptionId: string;

  private readonly processor: (
    data: SynchronizerMap[TInput['type']]['data']
  ) => Promise<void>;

  private status: SynchronizerStatus = 'idle';
  private cursor: string = '0';
  private initialized: boolean = false;

  constructor(
    workspace: WorkspaceService,
    input: TInput,
    cursorKey: string,
    processor: (data: SynchronizerMap[TInput['type']]['data']) => Promise<void>
  ) {
    this.workspace = workspace;
    this.connection = workspace.account.socket;
    this.input = input;
    this.cursorKey = cursorKey;
    this.id = this.generateId();
    this.processor = processor;

    this.eventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      this.ping.bind(this)
    );

    this.eventSubscriptionId = eventBus.subscribe((event) => {
      if (
        event.type === 'account.connection.message.received' &&
        event.accountId === this.workspace.account.id
      ) {
        this.handleMessage(event.message);
      } else if (
        event.type === 'account.connection.opened' &&
        event.accountId === this.workspace.account.id
      ) {
        this.eventLoop.trigger();
      } else if (
        event.type === 'account.connection.closed' &&
        event.accountId === this.workspace.account.id
      ) {
        this.eventLoop.stop();
      }
    });

    this.eventLoop.start();
  }

  public async init() {
    this.cursor = await this.fetchCursor();
    this.initConsumer();
    this.eventLoop.start();
    this.initialized = true;
  }

  private ping() {
    if (!this.initialized) {
      return;
    }

    this.initConsumer();
  }

  private handleMessage(message: Message) {
    if (message.type === 'synchronizer.output' && message.id === this.id) {
      this.sync(message as SynchronizerOutputMessage<TInput>);
    }
  }

  private async sync(message: SynchronizerOutputMessage<TInput>) {
    if (message.id !== this.id) {
      return;
    }

    if (this.status === 'processing') {
      return;
    }

    this.status = 'processing';
    let lastCursor: string | null = null;

    try {
      for (const item of message.items) {
        await this.processor(item.data);
        lastCursor = item.cursor;
      }
    } catch (error) {
      debug(`Error consuming items: ${error}`);
    } finally {
      if (lastCursor !== null) {
        this.cursor = lastCursor;
        await this.saveCursor(lastCursor);
      }

      this.status = 'idle';
      this.initConsumer();
    }
  }

  private initConsumer() {
    if (this.status === 'processing') {
      return;
    }

    if (!this.connection.isConnected()) {
      return;
    }

    debug(`Initializing consumer for ${this.input.type}`);

    const message: SynchronizerInputMessage = {
      id: this.id,
      type: 'synchronizer.input',
      userId: this.workspace.userId,
      input: this.input,
      cursor: this.cursor.toString(),
    };

    const sent = this.connection.send(message);
    if (sent) {
      this.status = 'waiting';
    }
  }

  private async fetchCursor() {
    const cursor = await this.workspace.database
      .selectFrom('cursors')
      .select('value')
      .where('key', '=', this.cursorKey)
      .executeTakeFirst();

    return cursor?.value ?? '0';
  }

  private async saveCursor(cursor: string) {
    await this.workspace.database
      .insertInto('cursors')
      .values({
        key: this.cursorKey,
        value: cursor,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('key').doUpdateSet({
          value: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  public destroy() {
    this.eventLoop.stop();
    eventBus.unsubscribe(this.eventSubscriptionId);
  }

  public async delete() {
    this.destroy();

    await this.workspace.database
      .deleteFrom('cursors')
      .where('key', '=', this.cursorKey)
      .execute();
  }

  private generateId() {
    return sha256(
      JSON.stringify({
        userId: this.workspace.userId,
        input: this.input,
      })
    );
  }
}
