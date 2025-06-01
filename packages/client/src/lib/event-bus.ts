import { Event } from '@colanode/client/types/events';

export interface Subscription {
  id: string;
  callback: (event: Event) => void;
}

export interface EventBus {
  subscribe(callback: (event: Event) => void): string;
  unsubscribe(subscriptionId: string): void;
  publish(event: Event): void;
}

export class EventBusService {
  private subscriptions: Map<string, Subscription>;
  private id = 0;

  constructor() {
    this.subscriptions = new Map<string, Subscription>();
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
    this.subscriptions.forEach((subscription) => {
      subscription.callback(event);
    });
  }
}

export const eventBus = new EventBusService();
