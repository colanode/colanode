import { Event } from '@/types/events';
import { redis } from '@/data/redis';
import { host } from '@/host';

const CHANNEL_NAME = process.env.REDIS_EVENTS_CHANNEL ?? 'events';

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
  private subscriptions: Map<string, Subscription>;
  private id = 0;
  private initialized = false;

  public constructor() {
    this.subscriptions = new Map<string, Subscription>();
  }

  public async init() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    if (host.environment === 'development') {
      return;
    }

    const client = redis.duplicate();
    client.subscribe(CHANNEL_NAME, (message) => {
      const envelope = JSON.parse(message) as DistributedEventEnvelope;
      if (envelope.hostId === host.id) {
        return;
      }

      this.processEvent(envelope.event);
    });
  }

  public subscribe(callback: (event: Event) => void): string {
    const id = (this.id++).toLocaleString();
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

    if (host.environment === 'production') {
      redis.publish(CHANNEL_NAME, JSON.stringify({ event, hostId: host.id }));
    }
  }

  private processEvent(event: Event) {
    this.subscriptions.forEach((subscription) => {
      subscription.callback(event);
    });
  }
}

export const eventBus = new EventBusService();
