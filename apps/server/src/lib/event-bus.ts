import { generateId, IdType } from '@colanode/core';

import { Event } from '@/types/events';
import { redis } from '@/data/redis';
import { config } from '@/lib/config';

export interface Subscription {
  id: string;
  callback: (event: Event) => void;
}

export interface EventBus {
  subscribe(callback: (event: Event) => void): string;
  unsubscribe(subscriptionId: string): void;
  publish(event: Event): void;
}

export type DistributedEventEnvelope = {
  event: Event;
  hostId: string;
};

export class EventBusService {
  private readonly subscriptions: Map<string, Subscription>;
  private readonly hostId: string;
  private subscriberId = 0;
  private initialized = false;

  public constructor() {
    this.subscriptions = new Map<string, Subscription>();
    this.hostId = generateId(IdType.Host);
  }

  public async init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (config.server.mode === 'standalone') {
      return;
    }

    const client = redis.duplicate();
    await client.connect();

    client.subscribe(config.redis.eventsChannel, (message) => {
      const envelope = JSON.parse(message) as DistributedEventEnvelope;
      if (envelope.hostId === this.hostId) {
        return;
      }

      this.processEvent(envelope.event);
    });
  }

  public subscribe(callback: (event: Event) => void): string {
    const id = (this.subscriberId++).toLocaleString();
    this.subscriptions.set(id, {
      callback,
      id,
    });
    return id;
  }

  public unsubscribe(subscriptionId: string) {
    if (!this.subscriptions.has(subscriptionId)) return;

    this.subscriptions.delete(subscriptionId);
  }

  public publish(event: Event) {
    this.processEvent(event);

    if (config.server.mode === 'standalone') {
      return;
    }

    redis.publish(
      config.redis.eventsChannel,
      JSON.stringify({ event, hostId: this.hostId })
    );
  }

  private processEvent(event: Event) {
    this.subscriptions.forEach((subscription) => {
      subscription.callback(event);
    });
  }
}

export const eventBus = new EventBusService();
